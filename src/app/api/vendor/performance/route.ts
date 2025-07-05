import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VendorCommissionService } from "@/lib/vendor-commission-service";
import { subDays, subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { convertPrice, convertPrices, isSupportedCurrency, type Currency } from "@/lib/currency-utils";

// GET vendor performance metrics
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month"; // month, quarter, year
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        let startDate: Date;
        let endDate = new Date();

        switch (period) {
            case "month":
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
                break;
            case "quarter":
                startDate = subMonths(new Date(), 3);
                break;
            case "year":
                startDate = subMonths(new Date(), 12);
                break;
            default:
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
        }

        // Get comprehensive performance data
        const [
            orders,
            products,
            reviews,
            commissionMetrics,
            productPerformance
        ] = await Promise.all([
            // Orders performance
            db.order.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
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
                                    name: true,
                                    category: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true
                        }
                    }
                }
            }),            // Products data
            db.product.findMany({
                where: { vendorId: vendorId },
                include: {
                    category: {
                        select: {
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            orderItems: {
                                where: {
                                    order: {
                                        createdAt: { gte: startDate, lte: endDate }
                                    }
                                }
                            },
                            reviews: {
                                where: {
                                    createdAt: { gte: startDate, lte: endDate }
                                }
                            }
                        }
                    },
                    orderItems: {
                        where: {
                            order: {
                                createdAt: { gte: startDate, lte: endDate }
                            }
                        },
                        select: {
                            quantity: true,
                            total: true
                        }
                    },
                    reviews: {
                        where: {
                            createdAt: { gte: startDate, lte: endDate }
                        },
                        select: {
                            rating: true
                        }
                    }
                }
            }),

            // Reviews and ratings
            db.review.findMany({
                where: {
                    product: { vendorId: vendorId },
                    createdAt: { gte: startDate, lte: endDate }
                }
            }),

            // Commission metrics
            VendorCommissionService.getAnalytics(vendorId, 30),

            // Product performance details
            db.product.findMany({
                where: {
                    vendorId: vendorId,
                    orderItems: {
                        some: {
                            order: {
                                createdAt: { gte: startDate, lte: endDate }
                            }
                        }
                    }
                },
                include: {
                    orderItems: {
                        where: {
                            order: {
                                createdAt: { gte: startDate, lte: endDate }
                            }
                        },
                        include: {
                            order: {
                                select: {
                                    status: true,
                                    createdAt: true
                                }
                            }
                        }
                    },
                    reviews: {
                        where: {
                            createdAt: { gte: startDate, lte: endDate }
                        }
                    }
                }
            })
        ]);

        // Calculate performance metrics
        const totalRevenue = orders.reduce((sum, order) => {
            const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            return sum + vendorTotal;
        }, 0);

        const totalOrderCount = orders.length;
        const uniqueCustomers = new Set(orders.map(order => order.user.id)).size;
        const averageOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

        // Customer retention rate (customers who made multiple orders)
        const customerOrderCounts = new Map();
        orders.forEach(order => {
            const customerId = order.user.id;
            customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1);
        });
        const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
        const retentionRate = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0;        // Product performance metrics
        const productMetrics = products.map(product => {
            const revenue = product.orderItems.reduce((sum, item) => sum + item.total, 0);
            const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
            const averageRating = product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0; return {
                    id: product.id,
                    name: product.name,
                    category: product.category?.name || 'Uncategorized',
                    revenue,
                    unitsSold,
                    orderCount: product._count.orderItems,
                    reviewCount: product._count.reviews,
                    averageRating,
                    revenuePerUnit: unitsSold > 0 ? revenue / unitsSold : 0
                };
        }).sort((a, b) => b.revenue - a.revenue);        // Category performance
        const categoryPerformance = new Map();
        productMetrics.forEach(product => {
            const category = product.category;
            const existing = categoryPerformance.get(category) || {
                category,
                revenue: 0,
                unitsSold: 0,
                productCount: 0,
                averageRating: 0
            };

            existing.revenue += product.revenue;
            existing.unitsSold += product.unitsSold;
            existing.productCount += 1;
            existing.averageRating = (existing.averageRating + product.averageRating) / 2;

            categoryPerformance.set(category, existing);
        });

        // Overall ratings performance
        const totalReviews = reviews.length;
        const overallRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        // Monthly/daily performance trends
        const performanceTrends: Array<{
            date: string;
            revenue: number;
            orders: number;
            customers: number;
        }> = [];

        // Calculate trends based on period
        const trendDays = period === "month" ? 30 : period === "quarter" ? 90 : 365;
        for (let i = trendDays - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= dayStart && orderDate < dayEnd;
            });

            const dayRevenue = dayOrders.reduce((sum, order) => {
                const vendorTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
                return sum + vendorTotal;
            }, 0);

            const dayCustomers = new Set(dayOrders.map(order => order.user.id)).size;

            performanceTrends.push({
                date: format(date, 'yyyy-MM-dd'),
                revenue: dayRevenue,
                orders: dayOrders.length,
                customers: dayCustomers
            });
        }

        const performanceData = {
            summary: {
                totalRevenue,
                totalOrders: totalOrderCount,
                uniqueCustomers,
                averageOrderValue,
                retentionRate,
                overallRating,
                totalReviews,
                totalProducts: products.length,
                totalCommissions: commissionMetrics.totalCommissions,
                averageCommissionRate: commissionMetrics.averageCommissionRate
            },
            productMetrics: productMetrics.slice(0, 10), // Top 10 products
            categoryPerformance: Array.from(categoryPerformance.values()),
            ratingDistribution,
            performanceTrends,
            topPerformers: {
                bestSellingProduct: productMetrics[0] || null,
                highestRatedProduct: productMetrics.sort((a, b) => b.averageRating - a.averageRating)[0] || null,
                mostReviewedProduct: productMetrics.sort((a, b) => b.reviewCount - a.reviewCount)[0] || null
            },
            period,
            dateRange: {
                start: format(startDate, 'yyyy-MM-dd'),
                end: format(endDate, 'yyyy-MM-dd')
            }
        };

        return NextResponse.json(performanceData);

    } catch (error) {
        console.error("Error fetching vendor performance metrics:", error);
        return NextResponse.json(
            { error: "Failed to fetch performance metrics" },
            { status: 500 }
        );
    }
}
