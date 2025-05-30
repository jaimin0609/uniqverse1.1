import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;

        // Create cache key for the category
        const cacheKey = cacheKeys.category(`blog:${slug}`);

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const category = await db.blogCategory.findFirst({
            where: {
                slug,
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Cache the result for 30 minutes (categories change infrequently)
        await cache.set(cacheKey, category, 1800);

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}
