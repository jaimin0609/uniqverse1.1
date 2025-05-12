import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "VENDOR")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const status = searchParams.get("status");
        const paymentStatus = searchParams.get("paymentStatus");
        const search = searchParams.get("search") || "";
        const sort = searchParams.get("sort") || "date-desc";
        const customerId = searchParams.get("customer");

        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // Build filter conditions
        const whereClause: any = {};

        if (status && status !== "all") {
            whereClause.status = status;
        }

        if (paymentStatus && paymentStatus !== "all") {
            whereClause.paymentStatus = paymentStatus;
        }

        if (customerId) {
            whereClause.userId = customerId;
        }

        if (search) {
            whereClause.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        // Determine sorting
        let orderBy: any = {};
        switch (sort) {
            case "date-desc":
                orderBy = { createdAt: "desc" };
                break;
            case "date-asc":
                orderBy = { createdAt: "asc" };
                break;
            case "total-desc":
                orderBy = { total: "desc" };
                break;
            case "total-asc":
                orderBy = { total: "asc" };
                break;
            default:
                orderBy = { createdAt: "desc" };
        }

        // Fetch orders with pagination
        const [orders, totalOrders] = await Promise.all([
            db.order.findMany({
                where: whereClause,
                orderBy,
                skip,
                take: pageSize,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                        },
                    },
                },
            }),
            db.order.count({ where: whereClause }),
        ]);

        // Calculate metrics
        const allOrders = await db.order.findMany({
            where: customerId ? { userId: customerId } : {},
            select: {
                status: true,
                total: true,
            },
        });

        const metrics = {
            totalOrders: totalOrders,
            processingOrders: allOrders.filter((o) => o.status === "PROCESSING").length,
            completedOrders: allOrders.filter((o) => o.status === "COMPLETED").length,
            revenue: allOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        };

        // Format orders for response
        const formattedOrders = orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            total: order.total,
            items: order.items.length,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            customer: order.user, // Map user to customer for frontend compatibility
        }));

        // Log this admin action
        await logAdminAction(
            "orders_view",
            `Admin viewed orders list with ${orders.length} results`,
            session.user.id
        );

        return NextResponse.json({
            orders: formattedOrders,
            pagination: {
                total: totalOrders,
                page,
                pageSize,
                totalPages: Math.ceil(totalOrders / pageSize),
            },
            metrics,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}