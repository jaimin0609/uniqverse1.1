import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheInvalidation } from "@/lib/redis";

// GET /api/admin/pages/[id] - Get a specific page
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

        const page = await db.page.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!page) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error("Error fetching page:", error);
        return NextResponse.json(
            { error: "Failed to fetch page" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/pages/[id] - Update a page
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
        const {
            title,
            slug,
            content,
            isPublished,
            metaTitle,
            metaDesc,
            externalLinks,
        } = data;        // Validate required fields
        if (!title || !slug) {
            return NextResponse.json(
                { error: "Title and slug are required" },
                { status: 400 }
            );
        }

        // Check if the page exists
        const existingPage = await db.page.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingPage) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            );
        }

        // Check if another page exists with the same slug (but different ID)
        if (slug !== existingPage.slug) {
            const slugExists = await db.page.findUnique({
                where: { slug },
            });

            if (slugExists) {
                return NextResponse.json(
                    { error: "Another page with this slug already exists" },
                    { status: 400 }
                );
            }
        }        // Update the page
        const updatedPage = await db.page.update({
            where: { id: resolvedParams.id },
            data: {
                title,
                slug,
                content,
                isPublished,
                metaTitle: metaTitle || title,
                metaDesc: metaDesc || "",
                settings: externalLinks.length ? { externalLinks } : undefined,
                updatedAt: new Date(),
            },
        });

        // Invalidate admin pages cache
        await cacheInvalidation.onAdminPagesChange();

        return NextResponse.json(updatedPage);
    } catch (error) {
        console.error("Error updating page:", error);
        return NextResponse.json(
            { error: "Failed to update page" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/pages/[id] - Delete a page
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

        // Check if the page exists
        const existingPage = await db.page.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingPage) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            );
        }        // Delete the page
        await db.page.delete({
            where: { id: resolvedParams.id },
        });

        // Invalidate admin pages cache
        await cacheInvalidation.onAdminPagesChange();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting page:", error);
        return NextResponse.json(
            { error: "Failed to delete page" },
            { status: 500 }
        );
    }
}
