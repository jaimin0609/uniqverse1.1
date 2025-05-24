import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";
        const take = parseInt(searchParams.get("take") || "10");
        const skip = parseInt(searchParams.get("skip") || "0");

        // Fetch published blog posts only
        const blogPosts = await db.blogPost.findMany({
            where: {
                isPublished: true,
                ...(search
                    ? {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            { content: { contains: search, mode: "insensitive" } },
                            { tags: { contains: search, mode: "insensitive" } },
                            { User: { name: { contains: search, mode: "insensitive" } } },
                        ],
                    }
                    : {}),
            },
            orderBy: { publishedAt: "desc" },
            take,
            skip,
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

        const total = await db.blogPost.count({
            where: {
                isPublished: true,
                ...(search
                    ? {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            { content: { contains: search, mode: "insensitive" } },
                            { tags: { contains: search, mode: "insensitive" } },
                            { User: { name: { contains: search, mode: "insensitive" } } },
                        ],
                    }
                    : {}),
            },
        });

        return NextResponse.json({
            blogPosts,
            total,
            pagination: {
                take,
                skip,
                hasMore: skip + take < total,
            },
        });
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog posts" },
            { status: 500 }
        );
    }
}
