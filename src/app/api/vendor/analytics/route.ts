import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VendorCommissionService } from "@/lib/vendor-commission-service";
import { subDays } from "date-fns";
import { convertPrice, convertPrices, isSupportedCurrency, type Currency } from "@/lib/currency-utils";

// GET vendor analytics
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        const startDate = subDays(new Date(), days);
        const previousStartDate = subDays(startDate, days);

        // Get current period data
        const [currentOrders, previousOrders, products, commissionData] = await Promise.all([
            // Current period orders
            db.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                    items: {
                        some: {
                            product: { vendorId: vendorId }
                        }
                    }
                },
                include: {
                    items: {
                        where: {
                            product: { vendorId: vendorId }
                        },
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),

            // Previous period orders for comparison
            db.order.findMany({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate
                    },
                    items: {
                        some: {
                            product: { vendorId: vendorId }
                        }
                    }
                },
                include: {
                    items: {
                        where: {
                            product: { vendorId: vendorId }
                        }
                    }
                }
            }),

            // All vendor products
            db.product.findMany({
                where: { vendorId: vendorId },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                            reviews: true
                        }
                    }
                }
            }),

            // Commission data using existing service
            VendorCommissionService.getAnalyticsWithCurrency(vendorId, days, currency)
        ]);

        // Calculate revenue metrics
        const currentRevenue = currentOrders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + item.total, 0);
        }, 0);

        const previousRevenue = previousOrders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + item.total, 0);
        }, 0);

        // Convert revenues to target currency
        const [convertedCurrentRevenue, convertedPreviousRevenue] = await convertPrices(
            [currentRevenue, previousRevenue],
            currency
        );

        // Calculate growth percentage
        const revenueGrowth = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        const orderGrowth = previousOrders.length > 0
            ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
            : 0;

        // Product performance analysis
        const productPerformance = await Promise.all(
            products.map(async (product) => {
                const productOrders = currentOrders.filter(order =>
                    order.items.some(item => item.product.id === product.id)
                );

                const revenue = productOrders.reduce((sum, order) => {
                    const productItems = order.items.filter(item => item.product.id === product.id);
                    return sum + productItems.reduce((itemSum, item) => itemSum + item.total, 0);
                }, 0);

                const views = product._count.reviews * 10; // Estimate views from reviews
                const conversionRate = views > 0 ? (product._count.orderItems / views) * 100 : 0;

                // Convert monetary values
                const [convertedPrice, convertedRevenue] = await convertPrices(
                    [product.price, revenue],
                    currency
                );

                return {
                    id: product.id,
                    name: product.name,
                    price: convertedPrice,
                    orders: product._count.orderItems,
                    revenue: convertedRevenue,
                    views: views,
                    conversionRate: conversionRate,
                    inventory: product.inventory,
                    status: product.isPublished ? 'Published' : 'Draft'
                };
            })
        );

        // Top performing products
        const topProducts = productPerformance
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);        // Daily revenue breakdown
        const dailyRevenue: Array<{
            date: string;
            revenue: number;
            orders: number;
        }> = [];

        for (let i = 0; i < days; i++) {
            const dayStart = subDays(new Date(), i);
            const dayEnd = subDays(new Date(), i - 1);

            const dayOrders = currentOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= dayStart && orderDate < dayEnd;
            });

            const dayRevenue = dayOrders.reduce((sum, order) => {
                return sum + order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            }, 0);

            const convertedDayRevenue = await convertPrice(dayRevenue, currency);

            dailyRevenue.unshift({
                date: dayStart.toISOString().split('T')[0],
                revenue: convertedDayRevenue,
                orders: dayOrders.length
            });
        }

        // Calculate additional metrics
        const totalOrders = currentOrders.length;
        const averageOrderValue = totalOrders > 0 ? convertedCurrentRevenue / totalOrders : 0;
        const totalProducts = products.length;
        const publishedProducts = products.filter(p => p.isPublished).length;
        const lowStockProducts = products.filter(p => p.inventory < 10).length;

        // Recent orders for the vendor
        const recentOrders = await Promise.all(
            currentOrders.slice(0, 10).map(async (order) => {
                const orderTotal = order.items.reduce((sum, item) => sum + item.total, 0);
                const convertedTotal = await convertPrice(orderTotal, currency);

                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    total: convertedTotal,
                    itemCount: order.items.length,
                    status: order.status,
                    createdAt: order.createdAt.toISOString()
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    revenue: convertedCurrentRevenue,
                    revenueGrowth,
                    orders: totalOrders,
                    orderGrowth,
                    averageOrderValue,
                    totalProducts,
                    publishedProducts,
                    lowStockProducts,
                    currency
                },
                commissions: commissionData,
                productPerformance: {
                    topProducts,
                    totalProducts,
                    publishedProducts
                },
                charts: {
                    dailyRevenue,
                    productPerformance: productPerformance.slice(0, 5)
                },
                recentActivity: {
                    recentOrders
                }
            }
        });

    } catch (error) {
        console.error("Error fetching vendor analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
