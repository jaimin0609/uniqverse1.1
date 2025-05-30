import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { cache } from "@/lib/redis";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
        const role = searchParams.get("role") || "all";
        const search = searchParams.get("search") || "";

        // Create cache key based on query parameters
        const cacheKey = `admin:customers:${role}:${search}:${page}:${pageSize}`;

        // Try to get data from cache first
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData);
        }

        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // Build where clause
        const whereClause: any = {};

        // Add role filter if specified
        if (role !== "all") {
            whereClause.role = role;
        }

        // Add search filter if provided
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination first
        const totalUsers = await db.user.count({
            where: whereClause
        });

        // Calculate actual total pages
        const totalPages = Math.ceil(totalUsers / pageSize);

        // Ensure page number doesn't exceed total pages
        const validatedPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const validatedSkip = (validatedPage - 1) * pageSize;

        // Fetch users with pagination
        const users = await db.user.findMany({
            take: pageSize,
            skip: validatedSkip,
            where: whereClause,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                role: true,
                orders: {
                    select: {
                        total: true
                    },
                    where: {
                        status: {
                            not: "CANCELLED"
                        }
                    }
                }
            }
        });

        // Transform data to include order count and total spent
        const formattedUsers = users.map(user => {
            const orderCount = user.orders.length;
            const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                role: user.role,
                orderCount,
                totalSpent
            };
        });        // Log this admin action
        if (session.user?.id) {
            await logAdminAction(
                "user_list_view",
                `Admin viewed customer list with filters: role=${role}, search=${search}, page=${validatedPage}`,
                session.user.id
            );
        }

        const result = {
            customers: formattedUsers,
            pagination: {
                total: totalUsers,
                page: validatedPage,
                pageSize,
                totalPages
            }
        };

        // Cache the result for 5 minutes (300 seconds) since admin data can change frequently
        await cache.set(cacheKey, result, 300);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}