import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const paymentStatus = searchParams.get("paymentStatus");

        const skip = (page - 1) * limit;
        const vendorId = session.user.id;

        // Build where clause for orders that contain vendor's products
        const where: any = {
            items: {
                some: {
                    product: {
                        vendorId: vendorId
                    }
                }
            }
        };

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (status && status !== "all") {
            where.status = status;
        }

        if (paymentStatus && paymentStatus !== "all") {
            where.paymentStatus = paymentStatus;
        }

        // Get orders with vendor's products
        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
            }),
            db.order.count({ where })
        ]);

        // Calculate vendor-specific totals for each order
        const formattedOrders = orders.map(order => {
            const vendorItems = order.items;
            const vendorTotal = vendorItems.reduce((sum, item) => sum + item.total, 0);

            return {
                id: order.id,
                orderNumber: order.orderNumber,
                customer: order.user,
                status: order.status,
                paymentStatus: order.paymentStatus,
                vendorTotal,
                vendorItems,
                createdAt: order.createdAt.toISOString(),
                shippingAddress: order.shippingAddress
            };
        });

        // Calculate stats for all vendor orders
        const allVendorOrders = await db.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            vendorId: vendorId
                        }
                    }
                }
            },
            include: {
                items: {
                    where: {
                        product: {
                            vendorId: vendorId
                        }
                    }
                }
            }
        });

        const stats = {
            total: allVendorOrders.length,
            pending: allVendorOrders.filter(o => o.status === 'PENDING').length,
            processing: allVendorOrders.filter(o => o.status === 'PROCESSING').length,
            completed: allVendorOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length,
            cancelled: allVendorOrders.filter(o => o.status === 'CANCELLED').length,
            totalRevenue: allVendorOrders.reduce((sum, order) => {
                const vendorItemsTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
                return sum + vendorItemsTotal;
            }, 0)
        };

        return NextResponse.json({
            orders: formattedOrders,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats
        });

    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
