import { NextRequest, NextResponse } from 'next/server';
import { constructEventFromPayload } from '@/lib/stripe';
import { db } from '@/lib/db';
import { DropshippingService } from '@/services/dropshipping/dropshipping-service';
import { VendorCommissionService } from '@/lib/vendor-commission-service';
import {
    sendOrderConfirmationEmail,
    sendPaymentFailureEmail,
    sendPaymentCancellationEmail,
    sendRefundNotificationEmail,
    sendActionRequiredEmail
} from '@/lib/email-utils';

// This API route processes Stripe webhook events
// https://stripe.com/docs/webhooks
export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    try {
        // Verify the webhook signature
        const event = constructEventFromPayload(signature, Buffer.from(body));

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'payment_intent.canceled':
                await handlePaymentIntentCancelled(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            case 'payment_intent.processing':
                await handlePaymentIntentProcessing(event.data.object);
                break;

            case 'payment_intent.requires_action':
                await handlePaymentIntentRequiresAction(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error(`Error processing webhook: ${err}`);
        return NextResponse.json(
            { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
            { status: 400 }
        );
    }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: any) {
    // Find the order associated with this payment intent
    const order = await db.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
    });

    if (!order) {
        console.error(`No order found for payment intent: ${paymentIntent.id}`);
        return;
    }    // Update order status
    await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            paidAt: new Date(),
        },
    });

    // Send order confirmation email
    await sendOrderConfirmationEmail(order.id);

    // Create vendor commissions for this order
    try {
        await VendorCommissionService.createCommissionsForOrder(order.id);
        console.log(`Created vendor commissions for order ${order.id}`);
    } catch (error) {
        console.error(`Error creating vendor commissions for order ${order.id}:`, error);
        // We don't want to stop the order flow if commission creation fails, just log the error
    }

    // Process dropshipping for this order
    try {
        await DropshippingService.processNewOrder(order.id);
        console.log(`Dropshipping process initiated for order ${order.id}`);
    } catch (error) {
        console.error(`Error processing dropshipping for order ${order.id}:`, error);
        // We don't want to stop the order flow if dropshipping fails, just log the error
    }

    console.log(`Updated order ${order.id} status to PAID`);
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: any) {
    const order = await db.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
    });

    if (!order) {
        console.error(`No order found for payment intent: ${paymentIntent.id}`);
        return;
    } await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: 'FAILED',
            status: 'ON_HOLD',
        },
    });

    // Send payment failure notification to customer
    await sendPaymentFailureEmail(order.id, paymentIntent.last_payment_error?.message);

    console.log(`Updated order ${order.id} status to FAILED payment`);
}

// Handle cancelled payment intent
async function handlePaymentIntentCancelled(paymentIntent: any) {
    const order = await db.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
    });

    if (!order) {
        console.error(`No order found for cancelled payment intent: ${paymentIntent.id}`);
        return;
    } await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: 'CANCELLED',
            status: 'CANCELLED',
            cancelledAt: new Date(),
        },
    });

    // Restore inventory for cancelled orders
    await restoreInventoryForOrder(order.id);

    // Send cancellation notification to customer
    await sendPaymentCancellationEmail(order.id);

    console.log(`Updated order ${order.id} status to CANCELLED`);
}

// Handle refunded charge
async function handleChargeRefunded(charge: any) {
    // Find the payment intent associated with this charge
    const paymentIntentId = charge.payment_intent;

    const order = await db.order.findFirst({
        where: { paymentIntentId },
    });

    if (!order) {
        console.error(`No order found for charge: ${charge.id}, payment intent: ${paymentIntentId}`);
        return;
    }

    // Check if it's a full or partial refund
    const isFullRefund = charge.amount_refunded === charge.amount; await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            status: isFullRefund ? 'REFUNDED' : 'PROCESSING',
        },
    });

    // If full refund, restore inventory
    if (isFullRefund) {
        await restoreInventoryForOrder(order.id);
    }

    // Send refund notification to customer
    await sendRefundNotificationEmail(order.id, isFullRefund, charge.amount_refunded / 100);

    console.log(`Updated order ${order.id} to ${isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED'}`);
}

// Handle payment intent in processing state
async function handlePaymentIntentProcessing(paymentIntent: any) {
    const order = await db.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
    });

    if (!order) {
        console.error(`No order found for payment intent: ${paymentIntent.id}`);
        return;
    } await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: 'PENDING',
            status: 'PROCESSING',
        },
    });

    console.log(`Updated order ${order.id} to PROCESSING payment status`);
}

// Handle payment intent that requires additional action
async function handlePaymentIntentRequiresAction(paymentIntent: any) {
    const order = await db.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
    });

    if (!order) {
        console.error(`No order found for payment intent: ${paymentIntent.id}`);
        return;
    }

    // We keep the order in pending status but log the required action
    console.log(`Payment for order ${order.id} requires additional action: ${paymentIntent.next_action?.type}`);

    // Optionally send an email reminder to complete the payment
    await sendActionRequiredEmail(order.id, paymentIntent.next_action?.type);
}

// Helper function to restore inventory when an order is cancelled or refunded
async function restoreInventoryForOrder(orderId: string) {
    // Get all items in the order
    const orderItems = await db.orderItem.findMany({
        where: { orderId },
        include: {
            product: true,
            variant: true,
        },
    });

    // Process each item and restore inventory
    for (const item of orderItems) {
        if (item.variantId) {
            // Update variant inventory
            const variant = await db.productVariant.findUnique({
                where: { id: item.variantId },
            });

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
                        userId: 'system', // Use a system user ID for automated changes
                    },
                });
            }
        } else {
            // Update product inventory
            const product = await db.product.findUnique({
                where: { id: item.productId },
            });

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
                        userId: 'system', // Use a system user ID for automated changes
                    },
                });
            }
        }
    } console.log(`Restored inventory for order ${orderId}`);
}