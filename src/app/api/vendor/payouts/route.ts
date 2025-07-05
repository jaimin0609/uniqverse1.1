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
        const currencyParam = url.searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        const payouts = await VendorCommissionService.getVendorPayoutsWithCurrency(
            session.user.id,
            currency
        );

        return NextResponse.json({
            success: true,
            payouts
        });

    } catch (error) {
        console.error("Error fetching vendor payouts:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch payouts",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
