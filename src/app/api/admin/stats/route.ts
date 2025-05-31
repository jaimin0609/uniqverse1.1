import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { format, subDays, startOfDay, endOfDay, subMonths, subYears } from "date-fns";
import { cache } from "@/lib/redis";
import { hashObject } from "@/lib/utils";

// Function to get date range based on the parameter
function getDateRange(range: string) {
    const now = new Date();

    switch (range) {
        case "week":
            return { start: subDays(now, 7), end: now };
        case "month":
            return { start: subDays(now, 30), end: now };
        case "year":
            return { start: subDays(now, 365), end: now };
        default:
            return { start: subDays(now, 7), end: now };
    }
}

// Function to get sales data grouped by day for a specific date range
async function getSalesByDay(start: Date, end: Date) {
    // Get orders for the specified date range
    const orders = await db.order.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
            status: {
                not: "CANCELLED",
            },
        },
        select: {
            total: true,
            createdAt: true,
        },
    });

    // Create a map to store sales by day
    const salesByDayMap = new Map();

    // Initialize with all dates in the range
    let currentDate = new Date(start);
    while (currentDate <= end) {
        const dateKey = format(currentDate, "EEEE"); // e.g., "Monday"
        salesByDayMap.set(dateKey, 0);
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    // Sum up sales for each day
    for (const order of orders) {
        const dayName = format(new Date(order.createdAt), "EEEE");
        const currentTotal = salesByDayMap.get(dayName) || 0;
        salesByDayMap.set(dayName, currentTotal + order.total);
    }

    // Convert the map to an array of objects
    return Array.from(salesByDayMap.entries()).map(([date, sales]) => ({
        date,
        sales,
    }));
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get date range parameter
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "week";

        // Create cache key based on range parameter
        const cacheKey = `admin:stats:${hashObject({ range })}`;
        // Try to get from cache first (stats change frequently but not every second)
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Calculate date range based on parameter
        let startDate: Date;
        const endDate = new Date();

        switch (range) {
            case "month":
                startDate = subDays(endDate, 30);
                break;
            case "year":
                startDate = subDays(endDate, 365);
                break;
            case "week":
            default:
                startDate = subDays(endDate, 7);
                break;
        }

        // Track previous period for growth calculations
        const previousPeriodStartDate = new Date(
            startDate.getTime() - (endDate.getTime() - startDate.getTime())
        );

        // Get total sales
        const totalSalesData = await db.order.aggregate({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    not: "CANCELLED"
                }
            },
            _sum: {
                total: true
            }
        });

        const totalSales = totalSalesData._sum.total || 0;

        // Get previous period sales for growth calculation
        const previousSalesData = await db.order.aggregate({
            where: {
                createdAt: {
                    gte: previousPeriodStartDate,
                    lt: startDate
                },
                status: {
                    not: "CANCELLED"
                }
            },
            _sum: {
                total: true
            }
        });

        const previousSales = previousSalesData._sum.total || 0;

        // Calculate sales growth rate
        const salesGrowthRate = previousSales === 0
            ? 100
            : Math.round(((totalSales - previousSales) / previousSales) * 100);

        // Get total orders
        const totalOrders = await db.order.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    not: "CANCELLED"
                }
            }
        });

        // Get previous period orders for growth calculation
        const previousOrders = await db.order.count({
            where: {
                createdAt: {
                    gte: previousPeriodStartDate,
                    lt: startDate
                },
                status: {
                    not: "CANCELLED"
                }
            }
        });

        // Calculate orders growth rate
        const ordersGrowthRate = previousOrders === 0
            ? 100
            : Math.round(((totalOrders - previousOrders) / previousOrders) * 100);

        // Get total products
        const totalProducts = await db.product.count();

        // Get previous period product count
        const previousProducts = await db.product.count({
            where: {
                createdAt: {
                    lt: startDate
                }
            }
        });

        // Calculate products growth rate (new products added during this period)
        const currentPeriodNewProducts = totalProducts - previousProducts;
        const productsGrowthRate = previousProducts === 0
            ? 100
            : Math.round((currentPeriodNewProducts / previousProducts) * 100);

        // Get total users
        const totalUsers = await db.user.count({
            where: {
                role: "CUSTOMER" // Only count customers
            }
        });

        // Get previous period user count
        const previousUsers = await db.user.count({
            where: {
                createdAt: {
                    lt: startDate
                },
                role: "CUSTOMER"
            }
        });

        // Calculate users growth rate (new users added during this period)
        const currentPeriodNewUsers = totalUsers - previousUsers;
        const usersGrowthRate = previousUsers === 0
            ? 100
            : Math.round((currentPeriodNewUsers / previousUsers) * 100);

        // Get recent orders
        const recentOrders = await db.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 5
        });

        // Get low stock products
        const lowStockProducts = await db.product.findMany({
            where: {
                inventory: {
                    lte: 10 // Default low stock threshold
                },
                isPublished: true
            },
            select: {
                id: true,
                name: true,
                inventory: true,
                lowStockThreshold: true
            },
            orderBy: {
                inventory: "asc"
            },
            take: 5
        });

        // Get sales by day for the chart
        const salesByDay: { date: string; sales: number }[] = [];
        let currentDay = new Date(startDate);

        while (currentDay <= endDate) {
            const dayStart = startOfDay(currentDay);
            const dayEnd = endOfDay(currentDay);

            const dayOrders = await db.order.aggregate({
                where: {
                    createdAt: {
                        gte: dayStart,
                        lte: dayEnd
                    },
                    status: {
                        not: "CANCELLED"
                    }
                },
                _sum: {
                    total: true
                }
            });

            salesByDay.push({
                date: format(currentDay, "MMM dd"),
                sales: dayOrders._sum.total || 0
            });

            currentDay.setDate(currentDay.getDate() + 1);
        }

        // Get counts for action items
        const pendingOrderCount = await db.order.count({
            where: {
                status: "PENDING"
            }
        }); const pendingReviewsCount = await db.review.count({
            where: {
                status: "PENDING"
            }
        });

        // Get newsletter statistics
        const totalSubscribers = await db.newsletterSubscription.count();
        const activeSubscribers = await db.newsletterSubscription.count({
            where: {
                status: "ACTIVE"
            }
        });
        const unsubscribedCount = await db.newsletterSubscription.count({
            where: {
                status: "UNSUBSCRIBED"
            }
        });
        const recentSubscriptions = await db.newsletterSubscription.count({
            where: {
                subscribedAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Get previous period newsletter stats for growth calculation
        const previousSubscriptions = await db.newsletterSubscription.count({
            where: {
                subscribedAt: {
                    gte: previousPeriodStartDate,
                    lt: startDate
                }
            }
        });

        const newsletterGrowthRate = previousSubscriptions === 0
            ? (recentSubscriptions > 0 ? 100 : 0)
            : ((recentSubscriptions - previousSubscriptions) / previousSubscriptions) * 100;

        // Log the admin dashboard view
        await logAdminAction(
            "dashboard_view",
            `Admin viewed dashboard with date range: ${range}`,
            session.user.id
        ); const result = {
            totalSales,
            totalOrders,
            totalProducts,
            totalUsers,
            newsletterStats: {
                totalSubscribers,
                activeSubscribers,
                unsubscribedCount,
                recentSubscriptions
            },
            recentOrders,
            lowStockProducts,
            salesByDay,
            pendingOrderCount,
            pendingReviewsCount,
            growthRates: {
                sales: salesGrowthRate,
                orders: ordersGrowthRate,
                products: productsGrowthRate,
                users: usersGrowthRate,
                newsletter: newsletterGrowthRate
            }
        };// Cache stats for 2 minutes (admin stats change frequently but not constantly)
        await cache.set(cacheKey, result, 120);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error generating admin dashboard stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}