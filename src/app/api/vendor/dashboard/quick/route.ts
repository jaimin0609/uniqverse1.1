import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { convertPrice, isSupportedCurrency } from "@/lib/currency-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        // Get only essential data for initial load
        const [
            productsCount,
            recentOrders,
            monthlyRevenue,
            pendingOrdersCount
        ] = await Promise.all([
            // Simple count of products
            db.product.count({
                where: { vendorId: vendorId }
            }),

            // Only get 5 most recent orders with minimal data
            db.order.findMany({
                where: {
                    items: {
                        some: {
                            product: { vendorId: vendorId }
                        }
                    }
                },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true
                        }
                    },
                    items: {
                        where: {
                            product: { vendorId: vendorId }
                        },
                        select: {
                            total: true,
                            quantity: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            }),

            // Get monthly revenue using aggregation
            db.vendorCommission.aggregate({
                where: {
                    vendorId: vendorId,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                },
                _sum: {
                    commissionAmount: true
                },
                _count: {
                    id: true
                }
            }),

            // Count pending orders
            db.order.count({
                where: {
                    status: 'PENDING',
                    items: {
                        some: {
                            product: { vendorId: vendorId }
                        }
                    }
                }
            })
        ]);

        // Calculate order totals and convert currency
        const ordersWithTotals = await Promise.all(
            recentOrders.map(async (order) => {
                const orderTotal = order.items.reduce((sum, item) => sum + item.total, 0);
                const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    customerName: order.user.name || 'Unknown',
                    total: await convertPrice(orderTotal, currency),
                    status: order.status,
                    createdAt: order.createdAt.toISOString(),
                    items: itemsCount
                };
            })
        );

        // Convert monthly revenue
        const convertedMonthlyRevenue = await convertPrice(
            monthlyRevenue._sum.commissionAmount || 0,
            currency
        );

        // Build quick stats
        const monthlyOrderCount = monthlyRevenue._count.id || 0;
        const stats = {
            totalProducts: productsCount,
            totalOrders: monthlyOrderCount,
            totalRevenue: convertedMonthlyRevenue,
            averageOrderValue: monthlyOrderCount > 0
                ? convertedMonthlyRevenue / monthlyOrderCount
                : 0,
            pendingOrders: pendingOrdersCount,
            monthlyGrowth: 0, // We'll calculate this separately if needed
            productViews: 0,  // We'll calculate this separately if needed
            conversionRate: 0 // We'll calculate this separately if needed
        };

        return NextResponse.json({
            stats,
            recentOrders: ordersWithTotals,
            topProducts: [], // We'll load this separately
            enhancedDashboard: null, // We'll load this separately
            currency
        });

    } catch (error) {
        console.error("Error fetching vendor dashboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
