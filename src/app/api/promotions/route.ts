import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { PromotionType } from "@/lib/prisma-types";
import { cache } from "@/lib/redis";
import { hashObject } from "@/lib/utils";

// GET /api/promotions - Get active promotions
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const typeParam = url.searchParams.get("type");
        const active = url.searchParams.get("active") === "true";

        // Create cache key based on query parameters
        const searchParams = { type: typeParam, active };
        const cacheKey = `promotions:${hashObject(searchParams)}`;        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const currentDate = new Date();

        // Convert type string to enum value if provided
        const type = typeParam ? typeParam as PromotionType : undefined;

        const where = {
            ...(type && { type }),
            ...(active && {
                isActive: true,
                startDate: { lte: currentDate },
                endDate: { gte: currentDate }
            }),
        };

        const promotions = await db.promotion.findMany({
            where,
            orderBy: { position: "asc" },
        });        // Cache promotions for 10 minutes (promotional content changes moderately)
        await cache.set(cacheKey, promotions, 600);

        return NextResponse.json(promotions);
    } catch (error) {
        console.error("Error fetching promotions:", error);
        return NextResponse.json(
            { error: "Failed to fetch promotions" },
            { status: 500 }
        );
    }
}

// POST /api/promotions - Create a new promotion (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await req.json();

        const promotion = await db.promotion.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                linkUrl: data.linkUrl,
                position: data.position || 0,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: data.isActive ?? true,
            },
        });

        // Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "CREATE_PROMOTION",
                details: `Created promotion: ${promotion.title}`,
                performedById: session.user.id,
            },
        });

        return NextResponse.json(promotion, { status: 201 });
    } catch (error) {
        console.error("Error creating promotion:", error);
        return NextResponse.json(
            { error: "Failed to create promotion" },
            { status: 500 }
        );
    }
}
