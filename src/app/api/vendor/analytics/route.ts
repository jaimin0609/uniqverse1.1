import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

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

        const startDate = subDays(new Date(), days);
        const previousStartDate = subDays(startDate, days);

        // Get current period data
        const [currentOrders, previousOrders, products] = await Promise.all([
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
            }),            // Vendor products
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
            })
        ]);

        // Calculate current metrics
        const currentRevenue = currentOrders.reduce((sum, order) => {
            const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            return sum + vendorTotal;
        }, 0);

        const previousRevenue = previousOrders.reduce((sum, order) => {
            const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            return sum + vendorTotal;
        }, 0);

        const revenueChange = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        const ordersChange = previousOrders.length > 0
            ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
            : 0;

        const averageOrderValue = currentOrders.length > 0
            ? currentRevenue / currentOrders.length
            : 0;        // Calculate total product engagement (using reviews as proxy for views)
        const totalViews = products.reduce((sum, product) => sum + (product._count.reviews || 0), 0);
        const conversionRate = totalViews > 0 ? (currentOrders.length / totalViews) * 100 : 0;

        // Process top products
        const productSales = new Map();
        currentOrders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product.id; const existing = productSales.get(productId) || {
                    id: productId,
                    name: item.product.name,
                    revenue: 0,
                    orders: 0,
                    views: 0
                };
                existing.revenue += item.total;
                existing.orders += 1;
                productSales.set(productId, existing);
            });
        });        // Add review data to products (using reviews as proxy for engagement)
        products.forEach(product => {
            const sales = productSales.get(product.id);
            if (sales) {
                sales.views = product._count.reviews || 0;
                sales.conversionRate = sales.views > 0 ? (sales.orders / sales.views) * 100 : 0;
            }
        });

        const topProducts = Array.from(productSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);        // Generate sales data (daily breakdown)
        const salesData: { date: string; sales: number; orders: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayOrders = currentOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= dayStart && orderDate < dayEnd;
            });

            const daySales = dayOrders.reduce((sum, order) => {
                const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
                return sum + vendorTotal;
            }, 0);

            salesData.push({
                date: date.toISOString().split('T')[0],
                sales: daySales,
                orders: dayOrders.length
            });
        }

        // Recent activity
        const recentActivity = currentOrders
            .slice(-10)
            .map(order => {
                const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
                return {
                    id: order.id,
                    type: "order",
                    description: `New order #${order.orderNumber}`,
                    date: order.createdAt.toISOString(),
                    amount: vendorTotal
                };
            })
            .reverse();

        const analytics = {
            overview: {
                totalRevenue: currentRevenue,
                revenueChange,
                totalOrders: currentOrders.length,
                ordersChange,
                totalProducts: products.length,
                averageOrderValue,
                conversionRate,
                productViews: totalViews
            },
            salesData,
            topProducts,
            recentActivity
        };

        return NextResponse.json(analytics);

    } catch (error) {
        console.error("Error fetching vendor analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
