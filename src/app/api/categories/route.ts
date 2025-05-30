import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

// GET - Retrieve all categories for public use
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const includeChildren = url.searchParams.get("includeChildren") === "true";
        const parentOnly = url.searchParams.get("parentOnly") === "true";

        // Create cache key based on query parameters
        const cacheKey = cacheKeys.category(`list:includeChildren:${includeChildren}:parentOnly:${parentOnly}`);

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build query conditions
        const whereClause: any = {};

        if (parentOnly) {
            whereClause.parentId = null; // Top-level categories only
        }

        const categories = await db.category.findMany({
            where: whereClause,
            include: {
                children: includeChildren,
                _count: {
                    select: {
                        products: {
                            where: {
                                isPublished: true, // Only count published products
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        // Transform the categories to include product count
        const formattedCategories = categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            parentId: category.parentId,
            children: includeChildren ? category.children : undefined,
            productCount: category._count.products,
        }));

        const result = {
            categories: formattedCategories,
            totalCount: categories.length,
        };

        // Cache the result for 30 minutes (categories change infrequently)
        await cache.set(cacheKey, result, 1800);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { message: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
