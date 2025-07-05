import { db } from "@/lib/db";
import { convertPrice, convertPrices, formatPrice, type Currency, isSupportedCurrency } from "@/lib/currency-utils";
import { EnhancedVendorCommissionService } from "./enhanced-vendor-commission-service";

export interface CommissionSettings {
    defaultCommissionRate: number;
    tieredRates?: {
        threshold: number;
        rate: number;
    }[];
    minimumPayout: number;
    paymentMethod: string;
    paymentDetails?: any;
}

export class VendorCommissionService {
    /**
     * Calculate commission for a vendor based on their settings and sales volume
     * @deprecated Use EnhancedVendorCommissionService.calculateEnhancedCommission instead
     */
    static async calculateCommissionRate(vendorId: string, monthlyVolume?: number): Promise<number> {
        // Fallback to enhanced service
        const commission = await EnhancedVendorCommissionService.calculateEnhancedCommission(
            vendorId,
            monthlyVolume || 1000, // Default sale amount for rate calculation
            'temp-order-id'
        );

        return commission.baseCommission / (monthlyVolume || 1000);
    }

    /**
     * Create commission records for vendor products in an order
     */
    static async createCommissionsForOrder(orderId: string): Promise<void> {
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                vendor: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        } for (const item of order.items) {
            if (item.product.vendorId && item.product.vendor?.role === 'VENDOR') {
                // Use enhanced commission calculation
                const commissionDetails = await EnhancedVendorCommissionService.calculateEnhancedCommission(
                    item.product.vendorId,
                    item.total,
                    order.id
                );

                // Create commission record with enhanced details
                await db.vendorCommission.create({
                    data: {
                        vendorId: item.product.vendorId,
                        orderId: order.id,
                        orderItemId: item.id,
                        productId: item.productId,
                        saleAmount: item.total,
                        commissionRate: commissionDetails.baseCommission / item.total,
                        commissionAmount: commissionDetails.vendorEarnings, // This is what the vendor actually earns
                        transactionFee: commissionDetails.transactionFee,
                        performanceBonus: commissionDetails.performanceBonus,
                        status: 'PENDING'
                    }
                });
            }
        }
    }

    /**
     * Get vendor's sales volume for the current month
     */
    static async getVendorMonthlySales(vendorId: string): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await db.vendorCommission.aggregate({
            where: {
                vendorId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                status: {
                    in: ['PENDING', 'APPROVED', 'PAID']
                }
            },
            _sum: {
                saleAmount: true
            }
        });

        return result._sum.saleAmount || 0;
    }    /**
     * Initialize commission settings for a new vendor
     * @deprecated Use EnhancedVendorCommissionService.initializeEnhancedVendorSettings instead
     */
    static async initializeVendorCommissionSettings(vendorId: string): Promise<void> {
        // Use enhanced service with default starter plan
        await EnhancedVendorCommissionService.initializeEnhancedVendorSettings(vendorId, 'STARTER');
    }

    /**
     * Generate vendor payout for a specific period
     */
    static async generateVendorPayout(
        vendorId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<string | null> {
        // Get all approved commissions in the period
        const commissions = await db.vendorCommission.findMany({
            where: {
                vendorId,
                status: 'APPROVED',
                payoutId: null,
                createdAt: {
                    gte: periodStart,
                    lte: periodEnd
                }
            }
        });

        if (commissions.length === 0) {
            return null;
        }

        const totalAmount = commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);

        // Check minimum payout threshold
        const settings = await db.vendorCommissionSettings.findUnique({
            where: { vendorId }
        });

        if (settings && totalAmount < settings.minimumPayout) {
            return null; // Don't create payout if below minimum
        }

        // Create payout record
        const payout = await db.vendorPayout.create({
            data: {
                vendorId,
                totalAmount,
                commissionCount: commissions.length,
                periodStart,
                periodEnd,
                status: 'PENDING',
                paymentMethod: settings?.paymentMethod || 'PAYPAL'
            }
        });

        // Update commissions to reference this payout
        await db.vendorCommission.updateMany({
            where: {
                id: {
                    in: commissions.map(c => c.id)
                }
            },
            data: {
                payoutId: payout.id,
                status: 'PAID'
            }
        });

        return payout.id;
    }

    /**
     * Approve commission (automatically approve after order is fulfilled)
     */
    static async approveCommission(commissionId: string): Promise<void> {
        await db.vendorCommission.update({
            where: { id: commissionId },
            data: {
                status: 'APPROVED',
                processedAt: new Date()
            }
        });
    }

    /**
     * Get vendor commission analytics
     */
    static async getVendorCommissionAnalytics(vendorId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const commissions = await db.vendorCommission.findMany({
            where: {
                vendorId,
                createdAt: {
                    gte: startDate
                }
            },
            include: {
                product: {
                    select: {
                        name: true,
                        price: true
                    }
                },
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const pendingEarnings = commissions
            .filter(c => c.status === 'PENDING')
            .reduce((sum, c) => sum + c.commissionAmount, 0);
        const paidEarnings = commissions
            .filter(c => c.status === 'PAID')
            .reduce((sum, c) => sum + c.commissionAmount, 0);

        // Get current commission settings
        const settings = await db.vendorCommissionSettings.findUnique({
            where: { vendorId }
        });

        return {
            totalEarnings,
            pendingEarnings,
            paidEarnings,
            commissionCount: commissions.length,
            currentCommissionRate: settings?.defaultCommissionRate || 0.05,
            recentCommissions: commissions.slice(0, 10),
            settings
        };
    }    /**
     * Get vendor payout history
     */
    static async getVendorPayouts(vendorId: string) {
        return await db.vendorPayout.findMany({
            where: { vendorId },
            include: {
                commissions: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Get comprehensive analytics for a vendor's commission performance
     */
    static async getAnalytics(vendorId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - days);

        // Get current period commissions
        const currentCommissions = await db.vendorCommission.findMany({
            where: {
                vendorId,
                createdAt: { gte: startDate }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true
                    }
                }
            }
        });

        // Get previous period commissions for comparison
        const previousCommissions = await db.vendorCommission.findMany({
            where: {
                vendorId,
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate
                }
            }
        });

        // Get payouts
        const payouts = await db.vendorPayout.findMany({
            where: { vendorId },
            orderBy: { createdAt: 'desc' }
        });

        // Get commission settings
        const settings = await db.vendorCommissionSettings.findUnique({
            where: { vendorId }
        });        // Calculate metrics
        const totalCommissions = currentCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const previousTotal = previousCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const commissionsChange = previousTotal > 0
            ? ((totalCommissions - previousTotal) / previousTotal) * 100
            : 0; const pendingPayouts = payouts
                .filter(p => p.status === 'PENDING')
                .reduce((sum, p) => sum + p.totalAmount, 0);

        const completedPayouts = payouts
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.totalAmount, 0);        // Daily commission breakdown
        const dailyCommissions: Array<{
            date: string;
            commissions: number;
            orders: number;
        }> = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayCommissions = currentCommissions.filter(c => {
                const commissionDate = new Date(c.createdAt);
                return commissionDate >= dayStart && commissionDate < dayEnd;
            }); dailyCommissions.push({
                date: dayStart.toISOString().split('T')[0],
                commissions: dayCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
                orders: dayCommissions.length
            });
        }

        // Top commission products
        const productCommissions = new Map();
        currentCommissions.forEach(commission => {
            const productId = commission.productId;
            const existing = productCommissions.get(productId) || {
                productId,
                productName: commission.product.name,
                totalCommissions: 0,
                totalSales: 0,
                commissionRate: commission.commissionRate
            };
            existing.totalCommissions += commission.commissionAmount;
            existing.totalSales += commission.saleAmount;
            productCommissions.set(productId, existing);
        });

        const topCommissionProducts = Array.from(productCommissions.values())
            .sort((a, b) => b.totalCommissions - a.totalCommissions)
            .slice(0, 10);        // Recent payouts
        const recentPayouts = payouts.slice(0, 5).map(payout => ({
            id: payout.id,
            amount: payout.totalAmount,
            status: payout.status,
            createdAt: payout.createdAt.toISOString(),
            processedAt: payout.processedAt?.toISOString()
        }));

        return {
            totalCommissions,
            commissionsChange,
            pendingPayouts,
            completedPayouts,
            averageCommissionRate: settings?.defaultCommissionRate || 0.05,
            dailyCommissions,
            topCommissionProducts,
            recentPayouts
        };
    }

    /**
     * Get vendor commission analytics with currency conversion
     */
    static async getVendorCommissionAnalyticsWithCurrency(
        vendorId: string,
        days: number = 30,
        currency: string = 'USD'
    ) {
        // Validate currency
        const targetCurrency = isSupportedCurrency(currency) ? currency : 'USD';

        // Get base analytics in USD
        const analytics = await this.getVendorCommissionAnalytics(vendorId, days);

        // Convert monetary values to target currency
        const convertedAnalytics = {
            ...analytics,
            totalEarnings: await convertPrice(analytics.totalEarnings, targetCurrency),
            pendingEarnings: await convertPrice(analytics.pendingEarnings, targetCurrency),
            paidEarnings: await convertPrice(analytics.paidEarnings, targetCurrency),
            currency: targetCurrency,
            recentCommissions: await Promise.all(analytics.recentCommissions.map(async (commission) => ({
                ...commission,
                commissionAmount: await convertPrice(commission.commissionAmount, targetCurrency),
                saleAmount: await convertPrice(commission.saleAmount, targetCurrency)
            }))),
            settings: analytics.settings ? {
                ...analytics.settings,
                minimumPayout: await convertPrice(analytics.settings.minimumPayout, targetCurrency)
            } : null
        };

        return convertedAnalytics;
    }

    /**
     * Get comprehensive analytics with currency conversion
     */
    static async getAnalyticsWithCurrency(vendorId: string, days: number = 30, currency: string = 'USD') {
        // Validate currency
        const targetCurrency = isSupportedCurrency(currency) ? currency : 'USD';

        // Get base analytics in USD
        const analytics = await this.getAnalytics(vendorId, days);

        // Convert monetary values
        const convertedAnalytics = {
            ...analytics,
            totalCommissions: await convertPrice(analytics.totalCommissions, targetCurrency),
            pendingPayouts: await convertPrice(analytics.pendingPayouts, targetCurrency),
            completedPayouts: await convertPrice(analytics.completedPayouts, targetCurrency),
            currency: targetCurrency,
            dailyCommissions: await Promise.all(analytics.dailyCommissions.map(async (daily) => ({
                ...daily,
                commissions: await convertPrice(daily.commissions, targetCurrency)
            }))),
            topCommissionProducts: await Promise.all(analytics.topCommissionProducts.map(async (product) => ({
                ...product,
                totalCommissions: await convertPrice(product.totalCommissions, targetCurrency),
                totalSales: await convertPrice(product.totalSales, targetCurrency)
            }))),
            recentPayouts: await Promise.all(analytics.recentPayouts.map(async (payout) => ({
                ...payout,
                amount: await convertPrice(payout.amount, targetCurrency)
            })))
        };

        return convertedAnalytics;
    }

    /**
     * Get vendor payout history with currency conversion
     */
    static async getVendorPayoutsWithCurrency(vendorId: string, currency: string = 'USD') {
        const targetCurrency = isSupportedCurrency(currency) ? currency : 'USD';

        const payouts = await this.getVendorPayouts(vendorId);

        // Convert monetary values
        const convertedPayouts = await Promise.all(payouts.map(async (payout) => ({
            ...payout,
            totalAmount: await convertPrice(payout.totalAmount, targetCurrency),
            currency: targetCurrency,
            commissions: await Promise.all(payout.commissions.map(async (commission) => ({
                ...commission,
                commissionAmount: await convertPrice(commission.commissionAmount, targetCurrency),
                saleAmount: await convertPrice(commission.saleAmount, targetCurrency)
            })))
        })));

        return convertedPayouts;
    }
}
