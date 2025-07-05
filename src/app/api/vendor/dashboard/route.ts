import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { convertPrice, convertPrices, isSupportedCurrency, type Currency } from "@/lib/currency-utils";
import { EnhancedVendorCommissionService } from "@/lib/enhanced-vendor-commission-service";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;

        // Get currency from query params
        const { searchParams } = new URL(request.url);
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        // Get enhanced vendor dashboard data
        const enhancedDashboard = await EnhancedVendorCommissionService.getEnhancedVendorDashboard(
            vendorId,
            currency
        );

        // Get vendor's products
        const products = await db.product.findMany({
            where: { vendorId: vendorId },
            select: {
                id: true,
                name: true,
                price: true,
                inventory: true,
                isPublished: true,
                createdAt: true,
                _count: {
                    select: {
                        orderItems: true,
                        reviews: true
                    }
                }
            }
        });

        // Get vendor's orders (orders containing vendor's products)
        const orders = await db.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            vendorId: vendorId
                        }
                    }
                }
            },
            include: {
                items: {
                    where: {
                        product: {
                            vendorId: vendorId
                        }
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate stats
        const totalProducts = products.length;
        const totalOrders = orders.length;

        // Calculate vendor's revenue (only from their products)
        const totalRevenue = orders.reduce((sum, order) => {
            const vendorItemsTotal = order.items.reduce((itemSum, item) => {
                return itemSum + item.total;
            }, 0);
            return sum + vendorItemsTotal;
        }, 0);

        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const pendingOrders = orders.filter(order =>
            order.status === 'PENDING' || order.status === 'PROCESSING'
        ).length;

        // Calculate monthly growth (comparing last 30 days to previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const lastThirtyDaysOrders = orders.filter(order =>
            new Date(order.createdAt) >= thirtyDaysAgo
        );
        const previousThirtyDaysOrders = orders.filter(order =>
            new Date(order.createdAt) >= sixtyDaysAgo && new Date(order.createdAt) < thirtyDaysAgo
        );

        const monthlyGrowth = previousThirtyDaysOrders.length > 0
            ? ((lastThirtyDaysOrders.length - previousThirtyDaysOrders.length) / previousThirtyDaysOrders.length) * 100
            : 0;        // Calculate total product reviews (as a proxy for engagement)
        const totalReviews = products.reduce((sum, product) => sum + (product._count.reviews || 0), 0);

        // Calculate conversion rate (orders / products)
        const conversionRate = totalProducts > 0 ? (totalOrders / totalProducts) * 100 : 0;        // Convert monetary values to requested currency
        const [
            convertedTotalRevenue,
            convertedAverageOrderValue
        ] = await convertPrices([totalRevenue, averageOrderValue], currency);

        // Format recent orders with currency conversion
        const recentOrders = await Promise.all(
            orders.slice(0, 10).map(async (order) => {
                const orderTotal = order.items.reduce((sum, item) => sum + item.total, 0);
                const convertedTotal = await convertPrice(orderTotal, currency);

                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    customerName: order.user.name || order.user.email,
                    total: convertedTotal,
                    status: order.status,
                    createdAt: order.createdAt.toISOString(),
                    items: order.items.length
                };
            })
        );

        // Format top products with currency conversion
        const topProducts = await Promise.all(
            products
                .map(async (product) => {
                    const productOrders = orders.filter(order =>
                        order.items.some(item => item.product.id === product.id)
                    );
                    const productRevenue = productOrders.reduce((sum, order) => {
                        const productItems = order.items.filter(item => item.product.id === product.id);
                        return sum + productItems.reduce((itemSum, item) => itemSum + item.total, 0);
                    }, 0);

                    const [convertedPrice, convertedRevenue] = await convertPrices([product.price, productRevenue], currency);

                    return {
                        id: product.id,
                        name: product.name,
                        price: convertedPrice,
                        inventory: product.inventory,
                        orders: product._count.orderItems,
                        revenue: convertedRevenue,
                        status: product.isPublished ? 'Published' : 'Draft'
                    };
                })
        );

        // Sort by revenue (after conversion)
        topProducts.sort((a, b) => b.revenue - a.revenue);

        const stats = {
            totalProducts,
            totalOrders,
            totalRevenue: convertedTotalRevenue,
            averageOrderValue: convertedAverageOrderValue,
            pendingOrders,
            monthlyGrowth,
            productViews: totalReviews, // Use totalReviews as a proxy for productViews
            conversionRate,
            currency // Include currency in response
        };

        return NextResponse.json({
            stats,
            recentOrders,
            topProducts: topProducts.slice(0, 10),
            enhancedDashboard // Include enhanced dashboard data in response
        });

    } catch (error) {
        console.error("Error fetching vendor dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
