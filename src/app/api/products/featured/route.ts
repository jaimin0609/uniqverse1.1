import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

// Make sure to export the GET function properly for Next.js 14 API routes
export async function GET(request: Request) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "8");
    const skip = (page - 1) * limit;

    try {
        // Generate cache key for featured products with pagination
        const cacheKey = cacheKeys.products(`featured_${page}_${limit}`);

        // Try to get from cache first
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            return NextResponse.json(cachedResult);
        }

        const products = await db.product.findMany({
            skip,
            take: limit,
            where: {
                isFeatured: true,
                isPublished: true,
            },
            include: {
                images: {
                    where: {
                        position: 0
                    },
                    take: 1
                },
                category: true,
            },
            orderBy: [
                { featuredOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        // Get total count for pagination info
        const totalCount = await db.product.count({
            where: {
                isFeatured: true,
                isPublished: true,
            },
        });

        const result = {
            products,
            pagination: {
                page,
                limit,
                totalCount,
                hasMore: skip + products.length < totalCount
            }
        };

        // Cache the result for 15 minutes (featured products change less frequently)
        await cache.set(cacheKey, result, 900);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        return NextResponse.json(
            { error: "Failed to fetch featured products" },
            { status: 500 }
        );
    }
}
