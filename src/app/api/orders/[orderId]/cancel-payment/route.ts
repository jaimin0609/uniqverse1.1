import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

// This endpoint allows cancelling a payment for an order
// POST /api/orders/[orderId]/cancel-payment
export async function POST(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const orderId = params.orderId;

    try {
        // Verify that the order exists
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                        variant: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Get user session for audit purposes
        const session = await getServerSession();
        const userId = session?.user?.email
            ? (await db.user.findUnique({ where: { email: session.user.email } }))?.id
            : 'system';

        // Update the order status to cancelled
        await db.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
                cancelledAt: new Date(),
            },
        });

        // Restore inventory for all items in the order
        for (const item of order.items) {
            if (item.variantId) {
                // Update variant inventory
                const variant = item.variant;
                if (variant) {
                    await db.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            inventory: variant.inventory + item.quantity,
                        },
                    });

                    // Log inventory change
                    await db.inventoryHistory.create({
                        data: {
                            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            productId: item.productId,
                            variantId: item.variantId,
                            previousValue: variant.inventory,
                            newValue: variant.inventory + item.quantity,
                            action: 'RESTORE_FROM_CANCELLED_ORDER',
                            notes: `Restored inventory due to cancelled order ${orderId}`,
                            userId: userId || 'system',
                        },
                    });
                }
            } else {
                // Update product inventory
                const product = item.product;
                if (product) {
                    await db.product.update({
                        where: { id: item.productId },
                        data: {
                            inventory: product.inventory + item.quantity,
                        },
                    });

                    // Log inventory change
                    await db.inventoryHistory.create({
                        data: {
                            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            productId: item.productId,
                            previousValue: product.inventory,
                            newValue: product.inventory + item.quantity,
                            action: 'RESTORE_FROM_CANCELLED_ORDER',
                            notes: `Restored inventory due to cancelled order ${orderId}`,
                            userId: userId || 'system',
                        },
                    });
                }
            }
        }

        // Log admin audit entry if available
        if (userId && userId !== 'system') {
            await db.adminAuditLog.create({
                data: {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    action: 'CANCEL_ORDER_PAYMENT',
                    details: `Cancelled payment for order ${order.orderNumber}`,
                    performedById: userId,
                },
            });
        }

        return NextResponse.json({
            message: 'Payment successfully cancelled',
            orderId: order.id,
            orderNumber: order.orderNumber,
        });
    } catch (error) {
        console.error('Error cancelling payment:', error);
        return NextResponse.json(
            { error: `Failed to cancel payment: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}