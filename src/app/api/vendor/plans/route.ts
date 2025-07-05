import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { EnhancedVendorCommissionService, VENDOR_PLANS } from "@/lib/enhanced-vendor-commission-service";
import { convertPrices, type Currency, isSupportedCurrency } from "@/lib/currency-utils";

// GET vendor plans and pricing
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        // Convert plan pricing to requested currency
        const plansWithConvertedPricing = await Promise.all(
            Object.values(VENDOR_PLANS).map(async (plan) => {
                const [convertedMonthlyFee, convertedTransactionFee] = await convertPrices(
                    [plan.monthlyFee, plan.transactionFee],
                    currency
                );

                return {
                    ...plan,
                    monthlyFee: convertedMonthlyFee,
                    transactionFee: convertedTransactionFee,
                    currency
                };
            })
        );

        // If vendor is logged in, get their current plan and recommendations
        if (session?.user?.role === 'VENDOR') {
            const vendorDashboard = await EnhancedVendorCommissionService.getEnhancedVendorDashboard(
                session.user.id,
                currency
            );

            return NextResponse.json({
                success: true,
                data: {
                    plans: plansWithConvertedPricing,
                    currentPlan: vendorDashboard.plan,
                    recommendation: vendorDashboard.recommendation,
                    metrics: vendorDashboard.metrics,
                    currency
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                plans: plansWithConvertedPricing,
                currency
            }
        });

    } catch (error) {
        console.error("Error fetching vendor plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch vendor plans" },
            { status: 500 }
        );
    }
}

// POST change vendor plan
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.role || session.user.role !== 'VENDOR') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planType } = await request.json();

        if (!planType || !VENDOR_PLANS[planType]) {
            return NextResponse.json(
                { error: "Invalid plan type" },
                { status: 400 }
            );
        }

        // Initialize enhanced vendor settings with new plan
        await EnhancedVendorCommissionService.initializeEnhancedVendorSettings(
            session.user.id,
            planType
        );

        // Get updated dashboard data
        const vendorDashboard = await EnhancedVendorCommissionService.getEnhancedVendorDashboard(
            session.user.id
        );

        return NextResponse.json({
            success: true,
            message: `Successfully switched to ${VENDOR_PLANS[planType].name}`,
            data: {
                currentPlan: vendorDashboard.plan,
                recommendation: vendorDashboard.recommendation
            }
        });

    } catch (error) {
        console.error("Error changing vendor plan:", error);
        return NextResponse.json(
            { error: "Failed to change vendor plan" },
            { status: 500 }
        );
    }
}
