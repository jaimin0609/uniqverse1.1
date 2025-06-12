import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;        // Get vendor's products
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
        const conversionRate = totalProducts > 0 ? (totalOrders / totalProducts) * 100 : 0;

        // Format recent orders
        const recentOrders = orders.slice(0, 10).map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.user.name || order.user.email,
            total: order.items.reduce((sum, item) => sum + item.total, 0),
            status: order.status,
            createdAt: order.createdAt.toISOString(),
            items: order.items.length
        }));

        // Format top products (by revenue)
        const topProducts = products
            .map(product => {
                const productOrders = orders.filter(order =>
                    order.items.some(item => item.product.id === product.id)
                );
                const productRevenue = productOrders.reduce((sum, order) => {
                    const productItems = order.items.filter(item => item.product.id === product.id);
                    return sum + productItems.reduce((itemSum, item) => itemSum + item.total, 0);
                }, 0); return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    inventory: product.inventory,
                    orders: product._count.orderItems,
                    revenue: productRevenue,
                    status: product.isPublished ? 'Published' : 'Draft'
                };
            })
            .sort((a, b) => b.revenue - a.revenue); const stats = {
                totalProducts,
                totalOrders,
                totalRevenue,
                averageOrderValue,
                pendingOrders,
                monthlyGrowth,
                productViews: totalReviews, // Use totalReviews as a proxy for productViews
                conversionRate
            };

        return NextResponse.json({
            stats,
            recentOrders,
            topProducts: topProducts.slice(0, 10)
        });

    } catch (error) {
        console.error("Error fetching vendor dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
