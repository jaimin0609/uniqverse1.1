import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { DropshippingService } from "@/services/dropshipping/dropshipping-service";

// POST endpoint to check for updates from all active supplier orders
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        // For cron jobs, we'll also allow no session
        const isAdmin = session?.user?.role === "ADMIN";
        const isCronRequest = request.headers.get("x-cron-key") === process.env.CRON_SECRET_KEY;

        if (!isAdmin && !isCronRequest) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call the dropshipping service to check for order updates
        const result = await DropshippingService.checkOrderUpdates();

        // If this was triggered by an admin, log the action
        if (isAdmin) {
            await logAdminAction(
                "check_supplier_updates",
                `Admin manually checked for supplier order updates`,
                session.user.id
            );
        }

        return NextResponse.json({
            success: true,
            message: `Checked ${result.totalOrders} supplier orders for updates`,
            updated: result.updatedOrders,
            details: result.details
        });
    } catch (error) {
        console.error("Error checking supplier order updates:", error);
        return NextResponse.json(
            { error: "Failed to check supplier order updates", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}