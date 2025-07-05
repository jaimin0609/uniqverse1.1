import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { EnhancedVendorCommissionService } from "@/lib/enhanced-vendor-commission-service";
import { convertPrice, convertPrices, isSupportedCurrency } from "@/lib/currency-utils";

// GET single vendor order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const orderId = resolvedParams.id;

        // Get currency parameter
        const { searchParams } = new URL(request.url);
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        // Find order with vendor's products
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                items: {
                    some: {
                        product: {
                            vendorId: vendorId
                        }
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    where: {
                        product: {
                            vendorId: vendorId
                        }
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: {
                                    take: 1,
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        }
                    }
                },
                shippingAddress: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Calculate vendor-specific total with commission deductions
        let vendorTotal = 0;
        for (const item of order.items) {
            const commissionDetails = await EnhancedVendorCommissionService.calculateEnhancedCommission(
                vendorId,
                item.total,
                order.id
            );
            vendorTotal += commissionDetails.vendorEarnings;
        }

        // Convert monetary values to target currency
        const convertedVendorTotal = await convertPrice(vendorTotal, currency);
        const convertedItems = await Promise.all(
            order.items.map(async (item) => ({
                ...item,
                price: await convertPrice(item.price, currency),
                total: await convertPrice(item.total, currency)
            }))
        );

        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.user,
            status: order.status,
            paymentStatus: order.paymentStatus,
            vendorTotal: convertedVendorTotal,
            vendorItems: convertedItems,
            createdAt: order.createdAt.toISOString(),
            shippingAddress: order.shippingAddress,
            currency
        };

        return NextResponse.json({ order: formattedOrder });

    } catch (error) {
        console.error("Error fetching vendor order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

// PUT - Update order status
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const orderId = resolvedParams.id;
        const { status } = await request.json();

        // Validate status
        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Check if order exists and belongs to vendor
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                items: {
                    some: {
                        product: {
                            vendorId: vendorId
                        }
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

        // Update order status
        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error updating vendor order:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}
