import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache } from "@/lib/redis";

export async function GET(request: Request) {
    const url = new URL(request.url); const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "8");  // Changed to match the frontend default
    const skip = (page - 1) * limit;

    const cacheKey = `featured-products:page:${page}:limit:${limit}`;

    // Try to get from cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
        return NextResponse.json(cachedResult);
    }

    try {
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
        });        // Get total count for pagination info
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

        // Cache the result for 30 minutes
        await cache.set(cacheKey, result, 1800);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        return NextResponse.json(
            { error: "Failed to fetch featured products" },
            { status: 500 }
        );
    }
}
