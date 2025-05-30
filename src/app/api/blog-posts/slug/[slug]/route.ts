import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;

        // Create cache key for the blog post
        const cacheKey = cacheKeys.blog(slug);

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const blogPost = await db.blogPost.findFirst({
            where: {
                slug,
                isPublished: true,
            },
            include: {
                User: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                BlogCategory: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!blogPost) {
            return NextResponse.json(
                { error: "Blog post not found" },
                { status: 404 }
            );
        }

        // Cache the result for 20 minutes
        await cache.set(cacheKey, blogPost, 1200);

        return NextResponse.json(blogPost);
    } catch (error) {
        console.error("Error fetching blog post:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog post" },
            { status: 500 }
        );
    }
}
