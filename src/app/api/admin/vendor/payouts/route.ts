import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { VendorCommissionService } from "@/lib/vendor-commission-service";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { vendorId, periodStart, periodEnd } = body;

        if (!vendorId || !periodStart || !periodEnd) {
            return NextResponse.json(
                { error: "Vendor ID, period start, and period end are required" },
                { status: 400 }
            );
        }

        const payoutId = await VendorCommissionService.generateVendorPayout(
            vendorId,
            new Date(periodStart),
            new Date(periodEnd)
        );

        if (!payoutId) {
            return NextResponse.json({
                success: false,
                message: "No eligible commissions found for payout or amount below minimum threshold"
            });
        }

        return NextResponse.json({
            success: true,
            message: "Vendor payout generated successfully",
            payoutId
        });

    } catch (error) {
        console.error("Error generating vendor payout:", error);
        return NextResponse.json(
            {
                error: "Failed to generate vendor payout",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
