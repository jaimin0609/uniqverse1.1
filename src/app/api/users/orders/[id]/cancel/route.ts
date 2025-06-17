import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-utils';
import { db } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = resolvedParams.id;

        // Find the order and ensure it belongs to the current user
        const order = await db.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id, // Ensure the order belongs to the current user
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if order can be cancelled
        if (!['PENDING', 'PROCESSING'].includes(order.status)) {
            return NextResponse.json({
                error: 'Order cannot be cancelled. Only orders in Pending or Processing status can be cancelled.'
            }, { status: 400 });
        }

        // Log the initial attempt
        console.log(`Attempting to cancel order ${orderId} for user ${session.user.id}`);

        try {
            // Update order status to CANCELLED
            const updatedOrder = await db.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED', // Use FAILED instead of CANCELLED for paymentStatus (which exists in enum)
                    cancelledAt: new Date()
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    images: {
                                        take: 1,
                                        select: {
                                            url: true,
                                        },
                                    },
                                    sku: true,
                                },
                            },
                            variant: true,
                        },
                    },
                    shippingAddress: true,
                },
            });

            // Format order data for response
            const formattedOrder = {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                paymentMethod: updatedOrder.paymentMethod || '',
                total: updatedOrder.total,
                subtotal: updatedOrder.subtotal,
                shippingCost: updatedOrder.shipping,
                tax: updatedOrder.tax,
                discount: updatedOrder.discount || 0,
                createdAt: updatedOrder.createdAt,
                updatedAt: updatedOrder.updatedAt,
                trackingNumber: updatedOrder.trackingNumber || null,
                trackingUrl: updatedOrder.trackingUrl || null,
                items: updatedOrder.items.map((item) => ({
                    id: item.id,
                    productId: item.productId,
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
                    options: parseOptions(item.variant?.options) || [],
                })),
                shippingAddress: formatAddress(updatedOrder.shippingAddress),
                billingAddress: formatAddress(updatedOrder.shippingAddress),
            };

            console.log(`Successfully cancelled order ${orderId}`);
            return NextResponse.json(formattedOrder);
        } catch (dbError: any) {
            console.error('Database error when cancelling order:', dbError);
            // More specific database error
            if (dbError.code) {
                return NextResponse.json({
                    error: 'Database error when cancelling order',
                    code: dbError.code,
                    message: dbError.message
                }, { status: 500 });
            }
            throw dbError; // re-throw to be caught by outer try/catch
        }
    } catch (error: any) {
        console.error('Error cancelling order:', error);
        return NextResponse.json(
            {
                error: 'Failed to cancel order',
                message: error?.message || 'An unexpected error occurred'
            },
            { status: 500 }
        );
    }
}

// Helper function to format address for API response
const formatAddress = (address: any) => {
    if (!address) return null;
    return {
        name: `${address.firstName} ${address.lastName}`,
        line1: address.address1,
        line2: address.address2 || null,
        city: address.city,
        state: address.state || "",
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone || null,
    };
};

// Helper function to parse variant options
const parseOptions = (optionsString: any) => {
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
                value: String(value)
            }));
        }
        return [];
    } catch (e) {
        console.error("Error parsing options:", e);
        return [];
    }
};