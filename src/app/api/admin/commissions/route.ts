import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { subDays } from "date-fns";
import { convertPrice, convertPrices, isSupportedCurrency, formatPrice, type Currency } from "@/lib/currency-utils";

// GET admin commission analytics
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        const startDate = subDays(new Date(), days);
        const previousStartDate = subDays(startDate, days);

        // Get current and previous period commission data
        const [currentCommissions, previousCommissions, vendors] = await Promise.all([
            // Current period commissions
            db.vendorCommission.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                include: {
                    vendor: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    order: {
                        select: {
                            orderNumber: true
                        }
                    }
                }
            }),

            // Previous period commissions for comparison
            db.vendorCommission.findMany({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate
                    }
                }
            }),

            // All vendors with their settings
            db.user.findMany({
                where: {
                    role: 'VENDOR'
                },
                include: {
                    vendorCommissionSettings: true,
                    _count: {
                        select: {
                            vendorCommissions: {
                                where: {
                                    createdAt: { gte: startDate }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Calculate overview metrics
        const currentPlatformEarnings = currentCommissions.reduce((sum, c) => {
            // Platform earnings = base commission + transaction fee - performance bonus
            const transactionFee = typeof c.transactionFee === 'object' ? Number(c.transactionFee) : (c.transactionFee || 0);
            const performanceBonus = typeof c.performanceBonus === 'object' ? Number(c.performanceBonus) : (c.performanceBonus || 0);
            const platformEarnings = (c.saleAmount * c.commissionRate) + transactionFee - performanceBonus;
            return sum + platformEarnings;
        }, 0);

        const currentVendorEarnings = currentCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

        const previousPlatformEarnings = previousCommissions.reduce((sum, c) => {
            const transactionFee = typeof c.transactionFee === 'object' ? Number(c.transactionFee) : (c.transactionFee || 0);
            const performanceBonus = typeof c.performanceBonus === 'object' ? Number(c.performanceBonus) : (c.performanceBonus || 0);
            const platformEarnings = (c.saleAmount * c.commissionRate) + transactionFee - performanceBonus;
            return sum + platformEarnings;
        }, 0);

        const previousVendorEarnings = previousCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

        const totalCommissionVolume = currentCommissions.reduce((sum, c) => sum + c.saleAmount, 0);
        const totalTransactionFees = currentCommissions.reduce((sum, c) => {
            const transactionFee = typeof c.transactionFee === 'object' ? Number(c.transactionFee) : (c.transactionFee || 0);
            return sum + transactionFee;
        }, 0);
        const averageCommissionRate = currentCommissions.length > 0
            ? currentCommissions.reduce((sum, c) => sum + c.commissionRate, 0) / currentCommissions.length
            : 0;

        const activeVendors = vendors.filter(v => v._count.vendorCommissions > 0).length;

        const earningsChange = previousPlatformEarnings > 0
            ? ((currentPlatformEarnings - previousPlatformEarnings) / previousPlatformEarnings) * 100
            : 0;

        const volumeChange = previousVendorEarnings > 0
            ? ((currentVendorEarnings - previousVendorEarnings) / previousVendorEarnings) * 100
            : 0;

        // Convert monetary values to target currency
        const [
            convertedPlatformEarnings,
            convertedVendorEarnings,
            convertedTransactionFees,
            convertedCommissionVolume
        ] = await convertPrices([
            currentPlatformEarnings,
            currentVendorEarnings,
            totalTransactionFees,
            totalCommissionVolume
        ], currency);

        // Top vendor earnings
        const vendorEarningsMap = new Map();
        currentCommissions.forEach(commission => {
            const vendorId = commission.vendorId;
            const existing = vendorEarningsMap.get(vendorId) || {
                vendorId,
                vendorName: commission.vendor.name,
                vendorEmail: commission.vendor.email,
                totalEarnings: 0,
                totalSales: 0,
                orderCount: 0,
                commissionRate: 0
            };
            existing.totalEarnings += commission.commissionAmount;
            existing.totalSales += commission.saleAmount;
            existing.orderCount += 1;
            existing.commissionRate = commission.commissionRate; // Use latest rate
            vendorEarningsMap.set(vendorId, existing);
        });

        const topVendorEarnings = Array.from(vendorEarningsMap.values())
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, 10);

        // Convert vendor earnings to target currency
        const convertedTopVendorEarnings = await Promise.all(
            topVendorEarnings.map(async (vendor) => ({
                ...vendor,
                totalEarnings: await convertPrice(vendor.totalEarnings, currency),
                totalSales: await convertPrice(vendor.totalSales, currency)
            }))
        );

        // Recent transactions
        const recentTransactions = currentCommissions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);

        // Convert recent transactions to target currency
        const convertedRecentTransactions = await Promise.all(
            recentTransactions.map(async (transaction) => {
                const transactionFee = typeof transaction.transactionFee === 'object' ? Number(transaction.transactionFee) : (transaction.transactionFee || 0);
                const performanceBonus = typeof transaction.performanceBonus === 'object' ? Number(transaction.performanceBonus) : (transaction.performanceBonus || 0);
                const platformEarnings = (transaction.saleAmount * transaction.commissionRate) + transactionFee - performanceBonus;

                return {
                    id: transaction.id,
                    vendorName: transaction.vendor.name,
                    productName: transaction.product.name,
                    orderNumber: transaction.order.orderNumber,
                    saleAmount: await convertPrice(transaction.saleAmount, currency),
                    commissionAmount: await convertPrice(transaction.commissionAmount, currency),
                    platformEarnings: await convertPrice(platformEarnings, currency),
                    status: transaction.status,
                    createdAt: transaction.createdAt.toISOString()
                };
            })
        );

        // Daily earnings breakdown
        const dailyEarnings: Array<{
            date: string;
            platformEarnings: number;
            vendorEarnings: number;
            totalVolume: number;
            transactionCount: number;
        }> = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayCommissions = currentCommissions.filter(c => {
                const commissionDate = new Date(c.createdAt);
                return commissionDate >= dayStart && commissionDate < dayEnd;
            });

            const dayPlatformEarnings = dayCommissions.reduce((sum, c) => {
                const transactionFee = typeof c.transactionFee === 'object' ? Number(c.transactionFee) : (c.transactionFee || 0);
                const performanceBonus = typeof c.performanceBonus === 'object' ? Number(c.performanceBonus) : (c.performanceBonus || 0);
                const platformEarnings = (c.saleAmount * c.commissionRate) + transactionFee - performanceBonus;
                return sum + platformEarnings;
            }, 0);

            const dayVendorEarnings = dayCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
            const dayVolume = dayCommissions.reduce((sum, c) => sum + c.saleAmount, 0);

            dailyEarnings.push({
                date: dayStart.toISOString().split('T')[0],
                platformEarnings: await convertPrice(dayPlatformEarnings, currency),
                vendorEarnings: await convertPrice(dayVendorEarnings, currency),
                totalVolume: await convertPrice(dayVolume, currency),
                transactionCount: dayCommissions.length
            });
        }

        const responseData = {
            overview: {
                totalPlatformEarnings: convertedPlatformEarnings,
                totalVendorEarnings: convertedVendorEarnings,
                totalTransactionFees: convertedTransactionFees,
                totalCommissionVolume: convertedCommissionVolume,
                activeVendors,
                averageCommissionRate,
                earningsChange,
                volumeChange
            },
            topVendorEarnings: convertedTopVendorEarnings,
            recentTransactions: convertedRecentTransactions,
            dailyEarnings,
            currency
        };

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error("Error fetching admin commission data:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch commission data",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
