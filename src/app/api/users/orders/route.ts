import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

// GET - Get all orders for the current user with pagination
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        } const url = new URL(req.url);

        // Pagination parameters
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Status filter (optional)
        const status = url.searchParams.get("status");

        // Create cache key for user orders
        const cacheKey = cacheKeys.user(`orders:${session.user.id}:page:${page}:limit:${limit}:status:${status || 'all'}`);

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build where conditions
        const where: any = {
            userId: session.user.id
        };

        if (status) {
            where.status = status;
        }

        // Execute query with pagination
        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    slug: true,
                                    images: {
                                        take: 1,
                                        orderBy: { position: 'asc' },
                                        select: { url: true }
                                    }
                                }
                            },
                            variant: {
                                select: {
                                    name: true,
                                    options: true
                                }
                            }
                        }
                    },
                    shippingAddress: true
                }
            }),
            db.order.count({ where })
        ]);        // Process orders to include image URLs directly
        const processedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                productImage: item.product.images?.[0]?.url || null,
                // Remove unnecessary nested data
                product: {
                    name: item.product.name,
                    slug: item.product.slug
                }
            }))
        }));

        const result = {
            orders: processedOrders,
            pagination: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit)
            }
        };

        // Cache the result for 5 minutes (order data changes frequently but not instantly)
        await cache.set(cacheKey, result, 300);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error fetching order history:", error);
        return NextResponse.json(
            { message: "Failed to fetch order history" },
            { status: 500 }
        );
    }
}

// GET order details by ID
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { message: "Order ID is required" },
                { status: 400 }
            );
        }

        // Find the specific order, ensuring it belongs to the current user
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                slug: true,
                                images: {
                                    take: 1,
                                    orderBy: { position: 'asc' },
                                    select: { url: true }
                                }
                            }
                        },
                        variant: {
                            select: {
                                name: true,
                                options: true
                            }
                        }
                    }
                },
                shippingAddress: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        // Process order to include image URLs directly
        const processedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productImage: item.product.images?.[0]?.url || null,
                // Remove unnecessary nested data
                product: {
                    name: item.product.name,
                    slug: item.product.slug
                }
            }))
        };

        return NextResponse.json({ order: processedOrder });

    } catch (error) {
        console.error("Error fetching order details:", error);
        return NextResponse.json(
            { message: "Failed to fetch order details" },
            { status: 500 }
        );
    }
}