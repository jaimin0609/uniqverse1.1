import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

// GET a specific supplier order
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierOrderId = params.id;

        // Get supplier order details
        const supplierOrder = await db.supplierOrder.findUnique({
            where: { id: supplierOrderId },
            include: {
                Supplier: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        website: true,
                    },
                },
                OrderItem: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                images: {
                                    take: 1,
                                    select: {
                                        url: true,
                                    },
                                },
                            },
                        },
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                createdAt: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!supplierOrder) {
            return NextResponse.json(
                { error: "Supplier order not found" },
                { status: 404 }
            );
        }

        // Log the admin action
        await logAdminAction(
            "supplier_order_view",
            `Admin viewed supplier order details: ${supplierOrder.id}`,
            session.user.id
        );

        return NextResponse.json(supplierOrder);
    } catch (error) {
        console.error("Error fetching supplier order details:", error);
        return NextResponse.json(
            { error: "Failed to fetch supplier order details" },
            { status: 500 }
        );
    }
}

// PATCH - Update supplier order status and tracking info
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierOrderId = params.id;
        const data = await request.json();

        // Get existing supplier order to log changes and update related items
        const existingOrder = await db.supplierOrder.findUnique({
            where: { id: supplierOrderId },
            include: {
                OrderItem: true,
            },
        });

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Supplier order not found" },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        // Update status if provided
        if (data.status) {
            updateData.status = data.status;
        }

        // Update tracking information if provided
        if (data.trackingNumber) {
            updateData.trackingNumber = data.trackingNumber;
        }

        if (data.trackingUrl) {
            updateData.trackingUrl = data.trackingUrl;
        }

        if (data.carrier) {
            updateData.carrier = data.carrier;
        }

        // Update estimated delivery if provided
        if (data.estimatedDelivery) {
            updateData.estimatedDelivery = new Date(data.estimatedDelivery);
        }

        // Update notes if provided
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        // Update external order ID if provided
        if (data.externalOrderId) {
            updateData.externalOrderId = data.externalOrderId;
        }

        // Update supplier order
        const updatedOrder = await db.supplierOrder.update({
            where: { id: supplierOrderId },
            data: updateData,
        });

        // If status or tracking info was updated, update all linked order items
        if (data.status || data.trackingNumber || data.trackingUrl) {
            // Update all linked order items
            await Promise.all(
                existingOrder.OrderItem.map(async (item) => {
                    await db.orderItem.update({
                        where: { id: item.id },
                        data: {
                            supplierOrderStatus: data.status || existingOrder.status,
                            supplierTrackingNumber: data.trackingNumber || existingOrder.trackingNumber,
                            supplierTrackingUrl: data.trackingUrl || existingOrder.trackingUrl,
                        },
                    });
                })
            );

            // If status is SHIPPED or COMPLETED, update the related customer orders' fulfillment status
            if (
                (data.status === "SHIPPED" || data.status === "COMPLETED") &&
                (existingOrder.status !== "SHIPPED" && existingOrder.status !== "COMPLETED")
            ) {
                // Get unique order IDs from order items
                const orderIds = Array.from(
                    new Set(existingOrder.OrderItem.map((item) => item.orderId))
                );

                // For each order, check if all items are now fulfilled by supplier
                for (const orderId of orderIds) {
                    // Get all items for this order
                    const orderItems = await db.orderItem.findMany({
                        where: { orderId },
                    });

                    // Check if all items are now fulfilled (have a supplier order with status SHIPPED or COMPLETED)
                    const allItemsFulfilled = orderItems.every(
                        (item) =>
                            item.supplierOrderId &&
                            (item.supplierOrderStatus === "SHIPPED" ||
                                item.supplierOrderStatus === "COMPLETED")
                    );

                    // If all items are fulfilled, update the order's fulfillment status
                    if (allItemsFulfilled) {
                        await db.order.update({
                            where: { id: orderId },
                            data: {
                                fulfillmentStatus: "FULFILLED",
                            },
                        });

                        // Log this update
                        await logAdminAction(
                            "order_auto_fulfilled",
                            `Order automatically marked as fulfilled due to supplier order completion`,
                            session.user.id
                        );
                    } else {
                        // If only some items are fulfilled, mark as partially fulfilled
                        const someItemsFulfilled = orderItems.some(
                            (item) =>
                                item.supplierOrderId &&
                                (item.supplierOrderStatus === "SHIPPED" ||
                                    item.supplierOrderStatus === "COMPLETED")
                        );

                        if (someItemsFulfilled) {
                            await db.order.update({
                                where: { id: orderId },
                                data: {
                                    fulfillmentStatus: "PARTIALLY_FULFILLED",
                                },
                            });
                        }
                    }
                }
            }
        }

        // Log the admin action with details of what changed
        const changes: string[] = [];
        if (data.status && data.status !== existingOrder.status) {
            changes.push(`status changed to ${data.status}`);
        }
        if (data.trackingNumber && data.trackingNumber !== existingOrder.trackingNumber) {
            changes.push(`tracking number added`);
        }

        await logAdminAction(
            "supplier_order_update",
            `Admin updated supplier order ${changes.length ? `(${changes.join(", ")})` : ""}`,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            supplierOrder: updatedOrder,
        });
    } catch (error) {
        console.error("Error updating supplier order:", error);
        return NextResponse.json(
            { error: "Failed to update supplier order" },
            { status: 500 }
        );
    }
}

// DELETE - Cancel a supplier order
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierOrderId = params.id;

        // Get existing supplier order for logging and updating related items
        const existingOrder = await db.supplierOrder.findUnique({
            where: { id: supplierOrderId },
            include: {
                OrderItem: true,
                Supplier: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Supplier order not found" },
                { status: 404 }
            );
        }

        // If the supplier order is already sent to the supplier (status beyond PENDING),
        // we should not delete it, but mark it as cancelled
        if (existingOrder.status !== "PENDING") {
            // Update the supplier order status to CANCELLED
            await db.supplierOrder.update({
                where: { id: supplierOrderId },
                data: {
                    status: "CANCELLED",
                    notes: `Cancelled by admin on ${new Date().toISOString()}. ${existingOrder.notes || ""
                        }`,
                },
            });

            // Update all linked order items
            await Promise.all(
                existingOrder.OrderItem.map(async (item) => {
                    await db.orderItem.update({
                        where: { id: item.id },
                        data: {
                            supplierOrderStatus: "CANCELLED",
                        },
                    });
                })
            );

            await logAdminAction(
                "supplier_order_cancel",
                `Admin cancelled supplier order for ${existingOrder.Supplier.name}`,
                session.user.id
            );

            return NextResponse.json({ success: true, action: "cancelled" });
        }

        // For PENDING orders, unlink items first
        await Promise.all(
            existingOrder.OrderItem.map(async (item) => {
                await db.orderItem.update({
                    where: { id: item.id },
                    data: {
                        supplierOrderId: null,
                        supplierOrderStatus: null,
                        supplierTrackingNumber: null,
                        supplierTrackingUrl: null,
                    },
                });
            })
        );

        // Delete the supplier order
        await db.supplierOrder.delete({
            where: { id: supplierOrderId },
        });

        // Log the admin action
        await logAdminAction(
            "supplier_order_delete",
            `Admin deleted supplier order for ${existingOrder.Supplier.name}`,
            session.user.id
        );

        return NextResponse.json({ success: true, action: "deleted" });
    } catch (error) {
        console.error("Error deleting supplier order:", error);
        return NextResponse.json(
            { error: "Failed to delete supplier order" },
            { status: 500 }
        );
    }
}