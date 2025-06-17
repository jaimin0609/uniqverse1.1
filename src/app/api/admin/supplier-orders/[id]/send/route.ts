import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { DropshippingService } from "@/services/dropshipping/dropshipping-service";

// POST endpoint to manually send a supplier order to the supplier API
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierOrderId = resolvedParams.id;

        // Verify the supplier order exists
        const supplierOrder = await db.supplierOrder.findUnique({
            where: { id: supplierOrderId },
            include: {
                Supplier: true,
                OrderItem: {
                    include: {
                        order: true
                    }
                }
            }
        });

        if (!supplierOrder) {
            return NextResponse.json(
                { error: "Supplier order not found" },
                { status: 404 }
            );
        }

        // Check if the supplier order is in a valid state for sending
        if (supplierOrder.status !== "PENDING") {
            return NextResponse.json(
                { error: "Only PENDING supplier orders can be sent to suppliers" },
                { status: 400 }
            );
        }

        // Check if supplier has API connection details
        if (!supplierOrder.Supplier.apiKey || !supplierOrder.Supplier.apiEndpoint) {
            return NextResponse.json(
                { error: `Supplier ${supplierOrder.Supplier.name} is missing API connection details` },
                { status: 400 }
            );
        }

        // Send the supplier order to the supplier's API
        const result = await DropshippingService.sendOrderToSupplier(supplierOrderId);

        // Log admin action
        await logAdminAction(
            "supplier_order_send",
            `Admin manually sent supplier order ${supplierOrderId} to ${supplierOrder.Supplier.name}`,
            session.user.id
        );

        if (!result.success) {
            return NextResponse.json(
                { error: "Failed to send order to supplier", details: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Order successfully sent to ${supplierOrder.Supplier.name}`,
            externalOrderId: result.externalOrderId
        });
    } catch (error) {
        console.error("Error sending supplier order:", error);
        return NextResponse.json(
            { error: "Failed to send supplier order", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}