import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { DropshippingService } from "@/services/dropshipping/dropshipping-service";
import { OrderStatus } from "@prisma/client";

// POST endpoint to manually process dropshipping for an order
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: orderId } = await params;        // Verify the order exists
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                supplier: true,
                            }
                        },
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Verify order is in a valid state for dropshipping (paid and not cancelled)
        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
            return NextResponse.json(
                { error: "Cannot process dropshipping for cancelled or refunded orders" },
                { status: 400 }
            );
        }

        // Count dropshippable items (with a supplier)
        const dropshippableItems = order.items.filter(item => item.product.supplierId);

        if (dropshippableItems.length === 0) {
            return NextResponse.json(
                { error: "No dropshipping items found in this order" },
                { status: 400 }
            );
        }

        // Process dropshipping for this order
        const result = await DropshippingService.processNewOrder(orderId);

        // Log admin action
        await logAdminAction(
            "manual_dropshipping_process",
            `Admin manually triggered dropshipping process for order #${order.orderNumber}`,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            message: `Dropshipping process initiated for ${dropshippableItems.length} items in order #${order.orderNumber}`,
            result
        });
    } catch (error) {
        console.error("Error processing dropshipping:", error);
        return NextResponse.json(
            {
                error: "Failed to process dropshipping",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}