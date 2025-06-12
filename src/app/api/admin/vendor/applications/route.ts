import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '50');

        // Build where clause
        const where: any = {};
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        // Get applications with user details
        const applications = await db.vendorApplication.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        // Get total count
        const totalCount = await db.vendorApplication.count({ where });

        // Get status counts
        const statusCounts = await db.vendorApplication.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        const stats = {
            total: totalCount,
            pending: statusCounts.find(s => s.status === 'PENDING')?._count.id || 0,
            approved: statusCounts.find(s => s.status === 'APPROVED')?._count.id || 0,
            rejected: statusCounts.find(s => s.status === 'REJECTED')?._count.id || 0,
            underReview: statusCounts.find(s => s.status === 'UNDER_REVIEW')?._count.id || 0,
        };

        return NextResponse.json({
            applications,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            },
            stats
        });

    } catch (error) {
        console.error("Error fetching vendor applications:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch vendor applications",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
