import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const categoriesParam = searchParams.get("categories");
        const exclude = searchParams.get("exclude") || "";
        const limit = parseInt(searchParams.get("limit") || "3");

        // Parse category IDs
        const categoryIds = categoriesParam ? categoriesParam.split(',') : [];

        if (categoryIds.length === 0) {
            return NextResponse.json({ blogPosts: [] });
        }

        // Create cache key based on categories, exclude, and limit
        const cacheKey = cacheKeys.blogList(`related:categories:${categoryIds.join(',')}:exclude:${exclude}:limit:${limit}`);

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Find related blog posts
        const blogPosts = await db.blogPost.findMany({
            where: {
                isPublished: true,
                id: { not: exclude },
                BlogCategory: {
                    some: {
                        id: { in: categoryIds }
                    }
                }
            },
            take: limit,
            orderBy: { publishedAt: "desc" },
            include: {
                User: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        const result = { blogPosts };

        // Cache the result for 15 minutes (related posts don't change as frequently)
        await cache.set(cacheKey, result, 900);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching related blog posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch related blog posts" },
            { status: 500 }
        );
    }
}
