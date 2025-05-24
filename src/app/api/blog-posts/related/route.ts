import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

        return NextResponse.json({ blogPosts });
    } catch (error) {
        console.error("Error fetching related blog posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch related blog posts" },
            { status: 500 }
        );
    }
}
