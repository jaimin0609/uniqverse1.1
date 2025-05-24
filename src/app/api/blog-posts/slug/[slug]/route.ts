import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;

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

        return NextResponse.json(blogPost);
    } catch (error) {
        console.error("Error fetching blog post:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog post" },
            { status: 500 }
        );
    }
}
