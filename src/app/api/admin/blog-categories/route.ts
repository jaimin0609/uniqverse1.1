import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheInvalidation } from "@/lib/redis";

// GET /api/admin/blog-categories - List all blog categories
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await db.blogCategory.findMany({
            orderBy: { name: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching blog categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog categories" },
            { status: 500 }
        );
    }
}

// POST /api/admin/blog-categories - Create a new blog category
export async function POST(request: NextRequest) {
    try {
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

        // Check if the slug is already in use
        const existingCategory = await db.blogCategory.findUnique({
            where: { slug },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: "Slug is already in use" },
                { status: 400 }
            );
        }

        // Create the blog category
        const category = await db.blogCategory.create({
            data: {
                id: `cat-${Date.now()}`,
                name,
                slug,
                description,
                updatedAt: new Date(),
            },
        });

        // Invalidate relevant caches
        await cacheInvalidation.onCategoryChange(category.id);

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating blog category:", error);
        return NextResponse.json(
            { error: "Failed to create blog category" },
            { status: 500 }
        );
    }
}
