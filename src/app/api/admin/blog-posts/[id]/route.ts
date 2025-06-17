import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cacheInvalidation } from "@/lib/redis";

// GET /api/admin/blog-posts/[id] - Get a specific blog post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const blogPost = await db.blogPost.findUnique({
            where: { id: resolvedParams.id },
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
            return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
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

// PUT /api/admin/blog-posts/[id] - Update a specific blog post
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const blogPost = await db.blogPost.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!blogPost) {
            return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
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

        // Check if the updated slug is already in use by another post
        if (slug !== blogPost.slug) {
            const existingPost = await db.blogPost.findUnique({
                where: { slug },
            });

            if (existingPost && existingPost.id !== resolvedParams.id) {
                return NextResponse.json(
                    { error: "Slug is already in use" },
                    { status: 400 }
                );
            }
        }        // Update categories if provided
        if (categories) {
            await db.blogPost.update({
                where: { id: resolvedParams.id },
                data: {
                    BlogCategory: {
                        set: [], // First remove all existing connections
                        connect: categories.map((id: string) => ({ id })), // Then add the new ones
                    },
                },
            });
        }

        // Update the blog post
        const updatedBlogPost = await db.blogPost.update({
            where: { id: resolvedParams.id },
            data: {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                isPublished: isPublished || false,
                publishedAt: isPublished
                    ? publishedAt || blogPost.publishedAt || new Date()
                    : null,
                metaTitle,
                metaDesc,
                tags,
                isAdEnabled: isAdEnabled || false,
                externalLinks: externalLinks ? JSON.parse(JSON.stringify(externalLinks)) : null,
            },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onBlogPostChange(slug);

        revalidatePath("/admin/content/blog");
        revalidatePath(`/blog/${slug}`);
        revalidatePath("/blog");

        return NextResponse.json(updatedBlogPost);
    } catch (error) {
        console.error("Error updating blog post:", error);
        return NextResponse.json(
            { error: "Failed to update blog post" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/blog-posts/[id] - Delete a specific blog post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const blogPost = await db.blogPost.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!blogPost) {
            return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
        }        // Delete the blog post
        await db.blogPost.delete({
            where: { id: resolvedParams.id },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onBlogPostChange(blogPost.slug);

        revalidatePath("/admin/content/blog");
        revalidatePath("/blog");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return NextResponse.json(
            { error: "Failed to delete blog post" },
            { status: 500 }
        );
    }
}
