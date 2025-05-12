import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { z } from "zod";

const orderUpdateSchema = z.object({
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED", "ON_HOLD"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
    fulfillmentStatus: z.enum(["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED", "RETURNED", "RESTOCKED", "SHIPPED", "DELIVERED"]).optional(),
    trackingNumber: z.string().nullable().optional(),
    trackingUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

// Helper function to format address data
const formatAddress = (address) => {
    if (!address) return null;
    return {
        name: `${address.firstName} ${address.lastName}`,
        line1: address.address1,
        line2: address.address2,
        city: address.city,
        state: address.state || "",
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
    };
};

// Helper function to parse variant options
const parseOptions = (optionsString) => {
    if (!optionsString) return [];
    try {
        if (typeof optionsString === 'string') {
            const parsedOptions = JSON.parse(optionsString);
            if (Array.isArray(parsedOptions)) {
                return parsedOptions;
            }
            // Convert object to array format if needed
            return Object.entries(parsedOptions).map(([name, value]) => ({
                name,
                value
            }));
        }
        return optionsString;
    } catch (e) {
        console.error("Error parsing options:", e);
        return [];
    }
};

// Get a specific order
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "VENDOR")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orderId = params.id;

        // Find the order with related data
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                images: true
                            }
                        },
                        variant: true,
                    },
                },
                shippingAddress: true, // Include shipping address
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // If the shipping address is missing but there's a shippingAddressId, try to fetch it directly
        let shippingAddressData = order.shippingAddress;

        if (!shippingAddressData && order.shippingAddressId) {
            shippingAddressData = await db.address.findUnique({
                where: { id: order.shippingAddressId }
            });
        }

        // Log admin action
        await logAdminAction(
            "order_view",
            `Admin viewed order #${order.orderNumber} (ID: ${order.id})`,
            session.user.id
        );

        // Format order data for response to match frontend expectations
        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            total: order.total,
            subtotal: order.subtotal,
            shippingCost: order.shipping,
            tax: order.tax,
            discount: order.discount || 0,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            trackingNumber: order.trackingNumber,
            trackingUrl: order.trackingUrl,
            fulfillmentStatus: order.fulfillmentStatus,
            customer: {
                id: order.user.id,
                name: order.user.name || null,
                email: order.user.email,
                phone: null, // Fixed: explicitly set phone to null since it might not exist on the User model
            },
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    featuredImage: item.product.images && item.product.images.length > 0
                        ? item.product.images[0].url
                        : null,
                    sku: item.product.sku || null,
                },
                options: parseOptions(item.variant?.options) || []
            })),
            shippingAddress: shippingAddressData ? formatAddress(shippingAddressData) : null,
            billingAddress: shippingAddressData ? formatAddress(shippingAddressData) : null, // Using shipping as billing
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

// Update an order
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "VENDOR")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orderId = params.id;
        const data = await request.json();

        // Validate update data
        const validatedData = orderUpdateSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if order exists
        const existingOrder = await db.order.findUnique({
            where: { id: orderId },
            select: {
                orderNumber: true,
                status: true,
                paymentStatus: true,
                fulfillmentStatus: true
            }
        });

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (data.status !== undefined) updateData.status = data.status;
        if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
        if (data.fulfillmentStatus !== undefined) updateData.fulfillmentStatus = data.fulfillmentStatus;
        if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
        if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl;
        if (data.notes !== undefined) updateData.notes = data.notes;

        // Record what's being changed for the audit log
        let changeDetails = [] as string[];
        if (data.status && data.status !== existingOrder.status) {
            changeDetails.push(`status from ${existingOrder.status} to ${data.status}`);
        }
        if (data.paymentStatus && data.paymentStatus !== existingOrder.paymentStatus) {
            changeDetails.push(`payment status from ${existingOrder.paymentStatus} to ${data.paymentStatus}`);
        }
        if (data.fulfillmentStatus && data.fulfillmentStatus !== existingOrder.fulfillmentStatus) {
            changeDetails.push(`fulfillment status from ${existingOrder.fulfillmentStatus} to ${data.fulfillmentStatus}`);
        }
        if (data.trackingNumber) {
            changeDetails.push(`tracking number updated`);
        }
        if (data.trackingUrl) {
            changeDetails.push(`tracking URL updated`);
        }
        if (data.notes) {
            changeDetails.push(`notes updated`);
        }

        // Handle order cancellations
        if (data.status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
            // Get order items
            const orderItems = await db.orderItem.findMany({
                where: { orderId },
                include: {
                    product: true,
                    variant: true
                }
            });

            // Restock each item
            for (const item of orderItems) {
                if (item.variantId && item.variant) {
                    // Update variant inventory
                    await db.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            inventory: { increment: item.quantity }
                        }
                    });

                    // Create inventory history record
                    await db.inventoryHistory.create({
                        data: {
                            id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            productId: item.productId,
                            variantId: item.variantId,
                            previousValue: item.variant.inventory,
                            newValue: item.variant.inventory + item.quantity,
                            action: "ORDER_CANCELLED",
                            userId: session.user.id,
                            notes: `Order #${existingOrder.orderNumber} cancelled, items restocked`
                        }
                    });
                } else {
                    // Update product inventory
                    await db.product.update({
                        where: { id: item.productId },
                        data: {
                            inventory: { increment: item.quantity }
                        }
                    });

                    // Create inventory history record
                    await db.inventoryHistory.create({
                        data: {
                            id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            productId: item.productId,
                            previousValue: item.product.inventory,
                            newValue: item.product.inventory + item.quantity,
                            action: "ORDER_CANCELLED",
                            userId: session.user.id,
                            notes: `Order #${existingOrder.orderNumber} cancelled, items restocked`
                        }
                    });
                }
            }

            // Set cancellation timestamp
            updateData.cancelledAt = new Date();
        }

        // Set payment timestamp if status is changing to PAID
        if (data.paymentStatus === "PAID" && existingOrder.paymentStatus !== "PAID") {
            updateData.paidAt = new Date();
        }

        // Update the order
        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                images: true
                            }
                        },
                        variant: true,
                    },
                },
                shippingAddress: true,
            },
        });

        // If the shipping address is missing but there's a shippingAddressId, try to fetch it directly
        let shippingAddressData = updatedOrder.shippingAddress;

        if (!shippingAddressData && updatedOrder.shippingAddressId) {
            shippingAddressData = await db.address.findUnique({
                where: { id: updatedOrder.shippingAddressId }
            });
        }

        // Log admin action
        await logAdminAction(
            "order_update",
            `Admin updated order #${existingOrder.orderNumber}: ${changeDetails.join(", ")}`,
            session.user.id
        );

        // Format response data
        const formattedOrder = {
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
            paymentStatus: updatedOrder.paymentStatus,
            paymentMethod: updatedOrder.paymentMethod,
            total: updatedOrder.total,
            subtotal: updatedOrder.subtotal,
            shippingCost: updatedOrder.shipping,
            tax: updatedOrder.tax,
            discount: updatedOrder.discount || 0,
            notes: updatedOrder.notes,
            createdAt: updatedOrder.createdAt,
            updatedAt: updatedOrder.updatedAt,
            trackingNumber: updatedOrder.trackingNumber,
            trackingUrl: updatedOrder.trackingUrl,
            fulfillmentStatus: updatedOrder.fulfillmentStatus,
            customer: {
                id: updatedOrder.user.id,
                name: updatedOrder.user.name || null,
                email: updatedOrder.user.email,
                phone: null, // Fixed: explicitly set phone to null since it might not exist on the User model
            },
            items: updatedOrder.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    featuredImage: item.product.images && item.product.images.length > 0
                        ? item.product.images[0].url
                        : null,
                    sku: item.product.sku || null,
                },
                options: parseOptions(item.variant?.options) || []
            })),
            shippingAddress: shippingAddressData ? formatAddress(shippingAddressData) : null,
            billingAddress: shippingAddressData ? formatAddress(shippingAddressData) : null, // Using shipping as billing
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}

// Add support for PUT method by delegating to the PATCH handler
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Simply delegate to the PATCH handler for compatibility with frontend forms
    return PATCH(request, { params });
}