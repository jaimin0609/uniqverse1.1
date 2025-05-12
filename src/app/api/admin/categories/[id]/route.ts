import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

// Get a single category by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const category = await db.category.findUnique({
            where: { id: params.id },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Transform the category to include product count
        const formattedCategory = {
            ...category,
            productCount: category._count.products,
            _count: undefined, // Remove the _count property
        };

        return NextResponse.json(formattedCategory);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

// Update a category
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Check if the category exists
        const existingCategory = await db.category.findUnique({
            where: { id: params.id },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Check if the slug is being changed and if it already exists
        if (data.slug !== existingCategory.slug) {
            const slugExists = await db.category.findUnique({
                where: { slug: data.slug },
            });

            if (slugExists) {
                // Make slug unique if it already exists
                const randomString = Math.random().toString(36).substring(2, 8);
                data.slug = `${data.slug}-${randomString}`;
            }
        }

        // Check if the parent would create a circular reference
        if (data.parentId) {
            // Can't set parent to itself
            if (data.parentId === params.id) {
                return NextResponse.json(
                    { error: "Cannot set a category as its own parent" },
                    { status: 400 }
                );
            }

            // Check if parent exists
            const parent = await db.category.findUnique({
                where: { id: data.parentId },
            });

            if (!parent) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
        }

        // Update the category
        const updatedCategory = await db.category.update({
            where: { id: params.id },
            data: {
                name: data.name.trim(),
                slug: data.slug,
                description: data.description || null,
                parentId: data.parentId || null,
                image: data.image || null,
            },
        });

        // Log admin action
        await logAdminAction(
            "category_update",
            `Admin updated category "${data.name}" (ID: ${params.id})`,
            session.user.id
        );

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// Delete a category
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if the category exists
        const category = await db.category.findUnique({
            where: { id: params.id },
            include: {
                products: true,
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Check if the category has products
        if (category.products.length > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete category with products",
                    message: "This category has products associated with it. Please reassign or delete these products first."
                },
                { status: 400 }
            );
        }

        // Check if the category has children
        const childCategories = await db.category.findMany({
            where: { parentId: params.id },
        });

        if (childCategories.length > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete category with subcategories",
                    message: "This category has subcategories. Please remove or reassign these subcategories first."
                },
                { status: 400 }
            );
        }

        // Delete the category
        await db.category.delete({
            where: { id: params.id },
        });

        // Log admin action
        await logAdminAction(
            "category_delete",
            `Admin deleted category "${category.name}" (ID: ${params.id})`,
            session.user.id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}