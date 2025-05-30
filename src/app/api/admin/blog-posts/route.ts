import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { cacheInvalidation } from "@/lib/redis";

// GET /api/admin/blog-posts - List all blog posts
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const take = Number(searchParams.get("take") || "10");
        const skip = Number(searchParams.get("skip") || "0");
        const search = searchParams.get("search") || "";

        const whereClause: Prisma.BlogPostWhereInput = {};

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { tags: { contains: search, mode: "insensitive" } },
            ];
        }

        const [blogPosts, total] = await Promise.all([
            db.blogPost.findMany({
                where: whereClause,
                take,
                skip,
                orderBy: { updatedAt: "desc" },
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
            }),
            db.blogPost.count({ where: whereClause }),
        ]);

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

// POST /api/admin/blog-posts - Create a new blog post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const {
            title,
            slug,
            excerpt,
            content,
            coverImage,
            isPublished,
            publishedAt,
            metaTitle,
            metaDesc,
            tags,
            isAdEnabled,
            externalLinks,
            categories,
        } = data;

        // Validate required fields
        if (!title || !slug || !content) {
            return NextResponse.json(
                { error: "Title, slug, and content are required" },
                { status: 400 }
            );
        }

        // Check if the slug is already in use
        const existingPost = await db.blogPost.findUnique({
            where: { slug },
        });

        if (existingPost) {
            return NextResponse.json(
                { error: "Slug is already in use" },
                { status: 400 }
            );
        }        // Create the blog post
        const blogPost = await db.blogPost.create({
            data: {
                id: `post-${Date.now()}`,
                title,
                slug,
                excerpt,
                content,
                coverImage,
                isPublished: isPublished || false,
                publishedAt: isPublished ? publishedAt || new Date() : null,
                authorId: session.user.id,
                metaTitle,
                metaDesc,
                tags,
                isAdEnabled: isAdEnabled || false,
                externalLinks: externalLinks ? JSON.parse(JSON.stringify(externalLinks)) : null,
                updatedAt: new Date(),
                BlogCategory: categories
                    ? {
                        connect: categories.map((id: string) => ({ id })),
                    }
                    : undefined,
            },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onBlogPostChange(slug);

        revalidatePath("/admin/content/blog");
        revalidatePath("/blog");

        return NextResponse.json(blogPost, { status: 201 });
    } catch (error) {
        console.error("Error creating blog post:", error);
        return NextResponse.json(
            { error: "Failed to create blog post" },
            { status: 500 }
        );
    }
}
