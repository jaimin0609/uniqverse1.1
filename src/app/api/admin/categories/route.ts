import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { cacheInvalidation } from "@/lib/redis";

// Get all categories
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await db.category.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        // Transform the categories to include product count
        const formattedCategories = categories.map((category) => ({
            ...category,
            productCount: category._count.products,
            _count: undefined, // Remove the _count property
        }));

        return NextResponse.json({ categories: formattedCategories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// Create a new category
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || data.name.trim() === "") {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Generate slug if not provided
        let slug = data.slug;
        if (!slug) {
            slug = data.name
                .toLowerCase()
                .replace(/[^\w\s]/gi, "")
                .replace(/\s+/g, "-");
        }

        // Check if slug already exists
        const existingCategory = await db.category.findUnique({
            where: { slug },
        });

        if (existingCategory) {
            // Make slug unique if it already exists
            const randomString = Math.random().toString(36).substring(2, 8);
            slug = `${slug}-${randomString}`;
        }

        const category = await db.category.create({
            data: {
                name: data.name.trim(),
                slug,
                description: data.description || null,
                parentId: data.parentId || null,
                image: data.image || null,
            },
        });

        // Log admin action
        await logAdminAction(
            "category_create",
            `Admin created category "${data.name}" (ID: ${category.id})`,
            session.user.id
        );

        // Invalidate cache
        await cacheInvalidation.onAdminCategoriesChange();

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}