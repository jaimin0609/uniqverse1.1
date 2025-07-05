import { db } from "@/lib/db";
import { convertPrice, convertPrices, formatPrice, type Currency, isSupportedCurrency } from "@/lib/currency-utils";

export interface VendorPlan {
    id: string;
    name: string;
    monthlyFee: number;
    transactionFee: number;
    commissionRate: number;
    benefits: string[];
    features: VendorPlanFeature[];
    maxProducts: number | null;
    prioritySupport: boolean;
    analyticsLevel: 'basic' | 'advanced' | 'premium';
}

export interface VendorPlanFeature {
    name: string;
    enabled: boolean;
    limit?: number;
}

export interface CommissionCalculation {
    baseCommission: number;
    transactionFee: number;
    monthlyFee: number;
    totalFees: number;
    vendorEarnings: number;
    platformEarnings: number;
    customerDiscount: number;
    performanceBonus: number;
}

export class EnhancedVendorCommissionService {
    // Vendor Plan Definitions
    static readonly VENDOR_PLANS: Record<string, VendorPlan> = {
        STARTER: {
            id: 'STARTER',
            name: 'Starter Plan',
            monthlyFee: 0,
            transactionFee: 0.30, // $0.30 per transaction
            commissionRate: 0.08, // 8% commission
            maxProducts: 50,
            prioritySupport: false,
            analyticsLevel: 'basic',
            benefits: [
                'Up to 50 products',
                'Basic analytics',
                'Standard support',
                'Mobile app access'
            ],
            features: [
                { name: 'productListings', enabled: true, limit: 50 },
                { name: 'basicAnalytics', enabled: true },
                { name: 'standardSupport', enabled: true },
                { name: 'mobileApp', enabled: true },
                { name: 'bulkUpload', enabled: false },
                { name: 'advancedAnalytics', enabled: false },
                { name: 'prioritySupport', enabled: false },
                { name: 'customBranding', enabled: false }
            ]
        },
        PROFESSIONAL: {
            id: 'PROFESSIONAL',
            name: 'Professional Plan',
            monthlyFee: 39.99,
            transactionFee: 0.20, // $0.20 per transaction
            commissionRate: 0.05, // 5% commission
            maxProducts: 500,
            prioritySupport: true,
            analyticsLevel: 'advanced',
            benefits: [
                'Up to 500 products',
                'Advanced analytics & reports',
                'Priority customer support',
                'Bulk product management',
                'Custom store branding',
                'Performance insights'
            ],
            features: [
                { name: 'productListings', enabled: true, limit: 500 },
                { name: 'basicAnalytics', enabled: true },
                { name: 'advancedAnalytics', enabled: true },
                { name: 'prioritySupport', enabled: true },
                { name: 'bulkUpload', enabled: true },
                { name: 'customBranding', enabled: true },
                { name: 'performanceInsights', enabled: true },
                { name: 'inventoryManagement', enabled: true }
            ]
        },
        ENTERPRISE: {
            id: 'ENTERPRISE',
            name: 'Enterprise Plan',
            monthlyFee: 99.99,
            transactionFee: 0.15, // $0.15 per transaction
            commissionRate: 0.03, // 3% commission
            maxProducts: null, // Unlimited
            prioritySupport: true,
            analyticsLevel: 'premium',
            benefits: [
                'Unlimited products',
                'Premium analytics & AI insights',
                'Dedicated account manager',
                'API access',
                'Custom integrations',
                'White-label solutions',
                'Marketing tools & campaigns'
            ],
            features: [
                { name: 'productListings', enabled: true },
                { name: 'basicAnalytics', enabled: true },
                { name: 'advancedAnalytics', enabled: true },
                { name: 'premiumAnalytics', enabled: true },
                { name: 'prioritySupport', enabled: true },
                { name: 'dedicatedManager', enabled: true },
                { name: 'apiAccess', enabled: true },
                { name: 'customIntegrations', enabled: true },
                { name: 'whiteLabelSolutions', enabled: true },
                { name: 'marketingTools', enabled: true },
                { name: 'bulkUpload', enabled: true },
                { name: 'customBranding', enabled: true }
            ]
        }
    };

    /**
     * Calculate comprehensive commission structure for a vendor
     */
    static async calculateEnhancedCommission(
        vendorId: string,
        saleAmount: number,
        orderId: string
    ): Promise<CommissionCalculation> {
        const vendor = await db.user.findUnique({
            where: { id: vendorId },
            include: {
                vendorCommissionSettings: true
            }
        });

        if (!vendor) {
            throw new Error(`Vendor ${vendorId} not found`);
        }

        const vendorPlan = vendor.vendorCommissionSettings?.planType || 'STARTER';
        const plan = this.VENDOR_PLANS[vendorPlan];

        // Calculate base commission
        const baseCommission = saleAmount * plan.commissionRate;

        // Calculate transaction fee
        const transactionFee = plan.transactionFee;

        // Get monthly performance metrics
        const performanceMetrics = await this.getVendorPerformanceMetrics(vendorId);

        // Calculate performance bonus/penalty
        const performanceBonus = this.calculatePerformanceBonus(
            performanceMetrics,
            saleAmount,
            plan
        );

        // Calculate customer discount based on vendor performance
        const customerDiscount = this.calculateCustomerDiscount(performanceMetrics, saleAmount);

        // Calculate final amounts
        const totalFees = baseCommission + transactionFee;
        const vendorEarnings = saleAmount - totalFees + performanceBonus;
        const platformEarnings = totalFees - performanceBonus;

        return {
            baseCommission,
            transactionFee,
            monthlyFee: plan.monthlyFee,
            totalFees,
            vendorEarnings,
            platformEarnings,
            customerDiscount,
            performanceBonus
        };
    }

    /**
     * Get vendor performance metrics
     */
    static async getVendorPerformanceMetrics(vendorId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [orders, reviews, products] = await Promise.all([
            // Order metrics
            db.order.findMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    items: {
                        some: {
                            product: { vendorId }
                        }
                    }
                },
                include: {
                    items: {
                        where: {
                            product: { vendorId }
                        }
                    }
                }
            }),

            // Review metrics
            db.review.findMany({
                where: {
                    product: { vendorId },
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),

            // Product metrics
            db.product.findMany({
                where: { vendorId },
                include: {
                    _count: {
                        select: { orderItems: true }
                    }
                }
            })
        ]);

        const totalSales = orders.reduce((sum, order) =>
            sum + order.items.reduce((itemSum, item) => itemSum + item.total, 0), 0
        );

        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        const fulfillmentRate = orders.length > 0
            ? orders.filter(order => order.status === 'DELIVERED').length / orders.length
            : 0;

        const returnRate = orders.length > 0
            ? orders.filter(order => order.status === 'REFUNDED').length / orders.length
            : 0;

        return {
            totalSales,
            orderCount: orders.length,
            averageRating,
            reviewCount: reviews.length,
            fulfillmentRate,
            returnRate,
            activeProducts: products.filter(p => p.isPublished).length,
            totalProducts: products.length
        };
    }

    /**
     * Calculate performance bonus/penalty
     */
    static calculatePerformanceBonus(metrics: any, saleAmount: number, plan: VendorPlan): number {
        let bonusMultiplier = 0;

        // Excellent performance bonuses
        if (metrics.averageRating >= 4.5) bonusMultiplier += 0.005; // 0.5% bonus
        if (metrics.fulfillmentRate >= 0.98) bonusMultiplier += 0.005; // 0.5% bonus
        if (metrics.returnRate <= 0.02) bonusMultiplier += 0.003; // 0.3% bonus
        if (metrics.orderCount >= 100) bonusMultiplier += 0.002; // 0.2% bonus

        // Performance penalties
        if (metrics.averageRating < 3.0) bonusMultiplier -= 0.01; // 1% penalty
        if (metrics.fulfillmentRate < 0.9) bonusMultiplier -= 0.008; // 0.8% penalty
        if (metrics.returnRate > 0.1) bonusMultiplier -= 0.005; // 0.5% penalty

        return saleAmount * bonusMultiplier;
    }

    /**
     * Calculate customer discount based on vendor performance
     */
    static calculateCustomerDiscount(metrics: any, saleAmount: number): number {
        // High-performing vendors can offer automatic discounts to customers
        // This encourages customer loyalty and repeat purchases
        let discountRate = 0;

        if (metrics.averageRating >= 4.8 && metrics.orderCount >= 50) {
            discountRate = 0.02; // 2% discount for top performers
        } else if (metrics.averageRating >= 4.5 && metrics.orderCount >= 20) {
            discountRate = 0.01; // 1% discount for good performers
        }

        return saleAmount * discountRate;
    }

    /**
     * Process monthly subscription fees
     */
    static async processMonthlySubscriptionFees(): Promise<void> {
        const vendors = await db.user.findMany({
            where: {
                role: 'VENDOR',
                vendorCommissionSettings: {
                    isActive: true
                }
            },
            include: {
                vendorCommissionSettings: true
            }
        });

        for (const vendor of vendors) {
            const planType = vendor.vendorCommissionSettings?.planType || 'STARTER';
            const plan = this.VENDOR_PLANS[planType];

            if (plan.monthlyFee > 0) {
                await db.vendorPayout.create({
                    data: {
                        vendorId: vendor.id,
                        totalAmount: -plan.monthlyFee, // Negative amount for fees
                        commissionCount: 0,
                        periodStart: new Date(),
                        periodEnd: new Date(),
                        status: 'PENDING',
                        paymentMethod: 'SUBSCRIPTION_FEE',
                        notes: `Monthly subscription fee for ${plan.name}`
                    }
                });
            }
        }
    }

    /**
     * Get vendor plan recommendations based on performance
     */
    static async getVendorPlanRecommendation(vendorId: string): Promise<{
        currentPlan: string;
        recommendedPlan: string;
        reasoning: string;
        potentialSavings: number;
    }> {
        const vendor = await db.user.findUnique({
            where: { id: vendorId },
            include: {
                vendorCommissionSettings: true
            }
        });

        if (!vendor) {
            throw new Error(`Vendor ${vendorId} not found`);
        }

        const currentPlan = (vendor.vendorCommissionSettings?.paymentDetails as any)?.planType || 'STARTER';
        const metrics = await this.getVendorPerformanceMetrics(vendorId);

        // Calculate potential savings/costs for each plan
        const currentPlanCost = this.calculateMonthlyCost(currentPlan, metrics);
        const professionalCost = this.calculateMonthlyCost('PROFESSIONAL', metrics);
        const enterpriseCost = this.calculateMonthlyCost('ENTERPRISE', metrics);

        let recommendedPlan = currentPlan;
        let reasoning = `Current ${currentPlan} plan is optimal for your sales volume.`;
        let potentialSavings = 0;

        // Recommend based on sales volume and activity
        if (metrics.totalSales > 10000 && metrics.orderCount > 100) {
            if (enterpriseCost < currentPlanCost) {
                recommendedPlan = 'ENTERPRISE';
                reasoning = `With ${metrics.orderCount} orders and $${metrics.totalSales} in sales, Enterprise plan would save you money on commission fees.`;
                potentialSavings = currentPlanCost - enterpriseCost;
            }
        } else if (metrics.totalSales > 2000 && metrics.orderCount > 20) {
            if (professionalCost < currentPlanCost) {
                recommendedPlan = 'PROFESSIONAL';
                reasoning = `Your sales volume of $${metrics.totalSales} would benefit from Professional plan's lower commission rate.`;
                potentialSavings = currentPlanCost - professionalCost;
            }
        }

        return {
            currentPlan,
            recommendedPlan,
            reasoning,
            potentialSavings
        };
    }

    /**
     * Calculate monthly cost for a plan based on metrics
     */
    private static calculateMonthlyCost(planType: string, metrics: any): number {
        const plan = this.VENDOR_PLANS[planType];
        const commissionCost = metrics.totalSales * plan.commissionRate;
        const transactionCosts = metrics.orderCount * plan.transactionFee;

        return plan.monthlyFee + commissionCost + transactionCosts;
    }

    /**
     * Initialize enhanced vendor commission settings
     */    static async initializeEnhancedVendorSettings(vendorId: string, planType: string = 'STARTER'): Promise<void> {
        const plan = this.VENDOR_PLANS[planType];

        if (!plan) {
            throw new Error(`Invalid plan type: ${planType}`);
        }        // Store enhanced settings in paymentDetails JSON field until database migration
        const enhancedSettings = {
            planType,
            features: plan.features as any, // Cast to any for JSON compatibility
            subscriptionStatus: 'ACTIVE',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        await db.vendorCommissionSettings.upsert({
            where: { vendorId }, create: {
                vendorId,
                defaultCommissionRate: plan.commissionRate,
                minimumPayout: 25.00, // Lower minimum payout
                paymentMethod: 'PAYPAL',
                paymentDetails: enhancedSettings,
                isActive: true
            },
            update: {
                defaultCommissionRate: plan.commissionRate,
                paymentDetails: enhancedSettings
            }
        });
    }

    /**
     * Get vendor dashboard data with enhanced metrics
     */
    static async getEnhancedVendorDashboard(vendorId: string, currency: Currency = 'USD') {
        const [vendor, metrics, commissions, plan] = await Promise.all([
            db.user.findUnique({
                where: { id: vendorId },
                include: { vendorCommissionSettings: true }
            }),
            this.getVendorPerformanceMetrics(vendorId),
            this.getVendorCommissions(vendorId),
            this.getVendorPlanRecommendation(vendorId)
        ]); if (!vendor) {
            throw new Error(`Vendor ${vendorId} not found`);
        }

        const planType = vendor.vendorCommissionSettings?.planType || 'STARTER';
        const currentPlan = this.VENDOR_PLANS[planType];

        // Convert monetary values to requested currency
        const [
            convertedTotalSales,
            convertedMonthlyFee,
            convertedCommissions,
            convertedPotentialSavings
        ] = await convertPrices([
            metrics.totalSales,
            currentPlan.monthlyFee,
            commissions.totalCommissions,
            plan.potentialSavings
        ], currency);

        // Calculate performance score
        const performanceScore = this.calculatePerformanceScore(metrics);

        // Calculate this month's commissions
        const thisMonthCommissions = commissions.totalCommissions * 0.7; // Approximate this month's portion

        // Calculate projected annual savings
        const projectedSavings = plan.potentialSavings * 12;

        return {
            plan: {
                planType,
                planName: currentPlan.name,
                monthlyFee: convertedMonthlyFee,
                commissionRate: currentPlan.commissionRate,
                transactionFee: currentPlan.transactionFee,
                subscriptionStatus: vendor.vendorCommissionSettings?.subscriptionStatus || 'ACTIVE',
                nextBillingDate: vendor.vendorCommissionSettings?.nextBillingDate?.toISOString() ||
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            metrics: {
                ...metrics,
                totalSales: convertedTotalSales,
                performanceScore,
                monthlyGrowth: ((metrics.totalSales - (metrics.totalSales * 0.8)) / (metrics.totalSales * 0.8)) * 100 // Approximate growth
            },
            recommendation: plan.recommendedPlan !== plan.currentPlan ? {
                recommended: plan.recommendedPlan,
                currentPlan: plan.currentPlan,
                reasoning: plan.reasoning,
                potentialSavings: convertedPotentialSavings,
                shouldUpgrade: true
            } : null,
            thisMonthCommissions,
            projectedSavings,
            currency
        };
    }

    /**
     * Get vendor commission summary
     */
    private static async getVendorCommissions(vendorId: string) {
        const commissions = await db.vendorCommission.findMany({
            where: { vendorId },
            include: {
                order: true,
                product: true
            }
        });

        const totalCommissions = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
        const pendingCommissions = commissions
            .filter(comm => comm.status === 'PENDING')
            .reduce((sum, comm) => sum + comm.commissionAmount, 0);

        return {
            totalCommissions,
            pendingCommissions,
            commissionCount: commissions.length
        };
    }

    /**
     * Calculate performance score based on metrics
     */
    static calculatePerformanceScore(metrics: any): number {
        let score = 0;

        // Rating score (40% weight)
        if (metrics.averageRating >= 4.5) score += 40;
        else if (metrics.averageRating >= 4.0) score += 30;
        else if (metrics.averageRating >= 3.5) score += 20;
        else if (metrics.averageRating >= 3.0) score += 10;

        // Fulfillment rate (30% weight)
        if (metrics.fulfillmentRate >= 0.98) score += 30;
        else if (metrics.fulfillmentRate >= 0.95) score += 25;
        else if (metrics.fulfillmentRate >= 0.90) score += 20;
        else if (metrics.fulfillmentRate >= 0.85) score += 15;

        // Return rate (20% weight) - lower is better
        if (metrics.returnRate <= 0.02) score += 20;
        else if (metrics.returnRate <= 0.05) score += 15;
        else if (metrics.returnRate <= 0.08) score += 10;
        else if (metrics.returnRate <= 0.10) score += 5;

        // Sales volume (10% weight)
        if (metrics.totalSales >= 5000) score += 10;
        else if (metrics.totalSales >= 2000) score += 8;
        else if (metrics.totalSales >= 1000) score += 6;
        else if (metrics.totalSales >= 500) score += 4;

        return Math.min(score, 100); // Cap at 100
    }
}

// Export the plans for use in frontend
export const VENDOR_PLANS = EnhancedVendorCommissionService.VENDOR_PLANS;
