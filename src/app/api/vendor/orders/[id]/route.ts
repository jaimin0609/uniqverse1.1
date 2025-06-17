import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

        // Calculate vendor-specific total
        const vendorTotal = order.items.reduce((sum, item) => sum + item.total, 0);

        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.user,
            status: order.status,
            paymentStatus: order.paymentStatus,
            vendorTotal,
            vendorItems: order.items,
            createdAt: order.createdAt.toISOString(),
            shippingAddress: order.shippingAddress
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
