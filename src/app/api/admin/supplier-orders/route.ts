import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

// GET all supplier orders
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const status = searchParams.get("status");
        const supplierId = searchParams.get("supplierId");
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        // Build the where clause for filtering
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        // Date range filter
        if (from || to) {
            where.orderDate = {};
            if (from) {
                where.orderDate.gte = new Date(from);
            }
            if (to) {
                where.orderDate.lte = new Date(to);
            }
        }

        // Get total count for pagination
        const totalOrders = await db.supplierOrder.count({ where });

        // Get supplier orders with filtering and pagination
        const supplierOrders = await db.supplierOrder.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                orderDate: "desc",
            },
            include: {
                Supplier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                OrderItem: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        total: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        OrderItem: true,
                    },
                },
            },
        });

        // Calculate metrics
        const metrics = {
            pendingOrders: 0,
            completedOrders: 0,
            totalSpent: 0,
        };

        // Get all supplier orders for metrics (limited to last 30 days for performance)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const allOrders = await db.supplierOrder.findMany({
            where: {
                orderDate: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                status: true,
                totalCost: true,
            },
        });

        // Calculate metrics
        metrics.pendingOrders = allOrders.filter((o) => o.status === "PENDING").length;
        metrics.completedOrders = allOrders.filter((o) => o.status === "COMPLETED").length;
        metrics.totalSpent = allOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

        // Log admin action
        await logAdminAction(
            "supplier_orders_view",
            `Admin viewed supplier orders list with ${supplierOrders.length} results`,
            session.user.id
        );

        return NextResponse.json({
            supplierOrders,
            pagination: {
                total: totalOrders,
                page,
                pageSize,
                totalPages: Math.ceil(totalOrders / pageSize),
            },
            metrics,
        });
    } catch (error) {
        console.error("Error fetching supplier orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch supplier orders" },
            { status: 500 }
        );
    }
}

// POST - Create a new supplier order
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get data from request
        const data = await request.json();

        // Validate required fields
        if (!data.supplierId) {
            return NextResponse.json(
                { error: "Supplier ID is required" },
                { status: 400 }
            );
        }

        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            return NextResponse.json(
                { error: "At least one item is required" },
                { status: 400 }
            );
        }

        // Verify all items exist and belong to the specified supplier
        const itemIds = data.items.map((item: any) => item.productId);

        const products = await db.product.findMany({
            where: {
                id: {
                    in: itemIds,
                },
            },
            select: {
                id: true,
                name: true,
                supplierId: true,
                costPrice: true,
            },
        });

        // Check if all products were found
        if (products.length !== itemIds.length) {
            return NextResponse.json(
                { error: "Some products do not exist" },
                { status: 400 }
            );
        }

        // Check if all products belong to the specified supplier
        const invalidProducts = products.filter(
            (product) => product.supplierId !== data.supplierId
        );

        if (invalidProducts.length > 0) {
            return NextResponse.json(
                {
                    error: "Some products do not belong to the specified supplier",
                    invalidProducts: invalidProducts.map((p) => p.name),
                },
                { status: 400 }
            );
        }

        // Calculate total cost
        let totalCost = 0;
        const itemsWithCost = data.items.map((item: any) => {
            const product = products.find((p) => p.id === item.productId);
            const cost = product?.costPrice || 0;
            const itemCost = cost * item.quantity;
            totalCost += itemCost;
            return {
                ...item,
                cost,
                total: itemCost,
            };
        });

        // Add shipping cost if provided
        if (data.shippingCost && !isNaN(parseFloat(data.shippingCost))) {
            totalCost += parseFloat(data.shippingCost);
        }

        // Type assertion to resolve Prisma type issues for supplierOrder.create
        // This section fixes the TypeScript error with the Prisma types
        const supplierOrder = await db.supplierOrder.create({
            data: {
                supplierId: data.supplierId,
                externalOrderId: data.externalOrderId || null,
                status: data.status || "PENDING",
                orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
                totalCost,
                shippingCost: data.shippingCost || null,
                currency: data.currency || "USD",
                trackingNumber: data.trackingNumber || null,
                trackingUrl: data.trackingUrl || null,
                carrier: data.carrier || null,
                estimatedDelivery: data.estimatedDelivery
                    ? new Date(data.estimatedDelivery)
                    : null,
                notes: data.notes || null,
            } as any, // Using type assertion to fix Prisma type incompatibility
        });

        // Link order items to the supplier order
        for (const item of data.items) {
            // First check if the order item exists
            if (item.orderItemId) {
                // Update existing order item with supplier order info
                await db.orderItem.update({
                    where: { id: item.orderItemId },
                    data: {
                        supplierOrderId: supplierOrder.id,
                        supplierOrderStatus: supplierOrder.status,
                        supplierTrackingNumber: supplierOrder.trackingNumber,
                        supplierTrackingUrl: supplierOrder.trackingUrl,
                    },
                });
            }
        }

        // Log the admin action
        await logAdminAction(
            "supplier_order_create",
            `Admin created supplier order for ${products[0]?.name ? products[0].name + (data.items.length > 1 ? ` and ${data.items.length - 1} other items` : '') : 'products'}`,
            session.user.id
        );

        return NextResponse.json(
            {
                success: true,
                supplierOrder: {
                    id: supplierOrder.id,
                    status: supplierOrder.status,
                    totalCost: supplierOrder.totalCost,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating supplier order:", error);
        return NextResponse.json(
            { error: "Failed to create supplier order" },
            { status: 500 }
        );
    }
}