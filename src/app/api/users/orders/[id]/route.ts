import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-utils';
import { db } from '@/lib/db';

// GET a specific order for the current user
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = params.id;

        // Find the order with related data
        const order = await db.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id, // Ensure the order belongs to the current user
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

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Format order data for response
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
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            trackingNumber: order.trackingNumber,
            trackingUrl: order.trackingUrl,
            items: order.items.map((item) => ({
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
            shippingAddress: formatAddress(order.shippingAddress),
            billingAddress: formatAddress(order.shippingAddress), // Using shipping as billing address
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// Helper function to format address for API response
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