import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { VendorCommissionService } from "@/lib/vendor-commission-service";
import { isSupportedCurrency } from "@/lib/currency-utils";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== "VENDOR") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '30');
        const currencyParam = url.searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        const analytics = await VendorCommissionService.getVendorCommissionAnalyticsWithCurrency(
            session.user.id,
            days,
            currency
        );

        return NextResponse.json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error("Error fetching vendor commission analytics:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch commission analytics",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
