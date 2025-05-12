import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// Default pagination limits
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Security check: only admins can access this endpoint
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
        const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        // Get total count for pagination
        const total = await db.supportTicket.count({ where });

        // Fetch tickets with pagination
        const tickets = await db.supportTicket.findMany({
            where,
            orderBy: [
                { updatedAt: 'desc' },
            ],
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                replies: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        // Get ticket statistics for dashboard
        const stats = await getTicketStats();

        return NextResponse.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats,
        });
    } catch (error) {
        console.error("Error fetching admin tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tickets" },
            { status: 500 }
        );
    }
}

// Helper function to get ticket statistics
async function getTicketStats() {
    // Get counts by status
    const statusCounts = await db.supportTicket.groupBy({
        by: ['status'],
        _count: true,
    });

    // Get counts by priority
    const priorityCounts = await db.supportTicket.groupBy({
        by: ['priority'],
        _count: true,
    });

    // Convert to a more usable format
    const stats: Record<string, number> = {};

    // Process status counts
    statusCounts.forEach(item => {
        const statusKey = item.status.toLowerCase().replace(/_/g, '');
        stats[statusKey] = item._count;
    });

    // Process priority counts
    priorityCounts.forEach(item => {
        const priorityKey = item.priority.toLowerCase() + 'Priority';
        stats[priorityKey] = item._count;
    });

    return stats;
}