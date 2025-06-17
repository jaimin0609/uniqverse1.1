import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheInvalidation } from "@/lib/redis";

// GET /api/admin/blog-categories/[id] - Get a specific blog category
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

        const category = await db.blogCategory.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Blog category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching blog category:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog category" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/blog-categories/[id] - Update a blog category
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

        const data = await request.json();
        const { name, slug, description } = data;

        // Validate required fields
        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
                { status: 400 }
            );
        }

        // Check if the category exists
        const existingCategory = await db.blogCategory.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Blog category not found" },
                { status: 404 }
            );
        }

        // Check if slug already exists (but not for this category)
        if (slug !== existingCategory.slug) {
            const slugExists = await db.blogCategory.findUnique({
                where: { slug },
            });

            if (slugExists) {
                return NextResponse.json(
                    { error: "Slug is already in use by another category" },
                    { status: 400 }
                );
            }
        }        // Update the blog category
        const updatedCategory = await db.blogCategory.update({
            where: { id: resolvedParams.id },
            data: {
                name,
                slug,
                description,
                updatedAt: new Date(),
            },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onCategoryChange(resolvedParams.id);

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("Error updating blog category:", error);
        return NextResponse.json(
            { error: "Failed to update blog category" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/blog-categories/[id] - Delete a blog category
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

        // Check if the category exists
        const existingCategory = await db.blogCategory.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Blog category not found" },
                { status: 404 }
            );
        }

        // Check if the category is associated with any blog posts
        const postsWithCategory = await db.blogPost.count({
            where: {
                BlogCategory: {
                    some: {
                        id: resolvedParams.id,
                    },
                },
            },
        });

        if (postsWithCategory > 0) {
            // Instead of blocking deletion, we could remove the category from these posts
            // For now, we'll just inform the admin
            return NextResponse.json(
                {
                    error: "Cannot delete category that is associated with blog posts",
                    postsCount: postsWithCategory
                },
                { status: 400 }
            );
        }        // Delete the blog category
        await db.blogCategory.delete({
            where: { id: resolvedParams.id },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onCategoryChange(resolvedParams.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting blog category:", error);
        return NextResponse.json(
            { error: "Failed to delete blog category" },
            { status: 500 }
        );
    }
}
