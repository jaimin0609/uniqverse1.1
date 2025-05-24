import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/pages - List all pages
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get search query if any
        const searchParams = request.nextUrl.searchParams;
        const searchQuery = searchParams.get("search") || "";

        // Fetch pages with search filter
        const pages = await db.page.findMany({
            where: {
                OR: [
                    { title: { contains: searchQuery, mode: "insensitive" } },
                    { slug: { contains: searchQuery, mode: "insensitive" } },
                    { content: { contains: searchQuery, mode: "insensitive" } },
                ],
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error("Error fetching pages:", error);
        return NextResponse.json(
            { error: "Failed to fetch pages" },
            { status: 500 }
        );
    }
}

// POST /api/admin/pages - Create a new page
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json(); const {
            title,
            slug,
            content,
            isPublished = false,
            metaTitle,
            metaDesc,
            externalLinks = [],
        } = data;

        // Validate required fields
        if (!title || !slug) {
            return NextResponse.json(
                { error: "Title and slug are required" },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingPage = await db.page.findUnique({
            where: { slug },
        });

        if (existingPage) {
            return NextResponse.json(
                { error: "A page with this slug already exists" },
                { status: 400 }
            );
        }                // Create the page
        const page = await db.page.create({
            data: {
                id: `page-${Date.now()}`,
                title,
                slug,
                content,
                isPublished,
                metaTitle: metaTitle || title,
                metaDesc: metaDesc || "",
                settings: externalLinks.length ? { externalLinks } : undefined,
                authorId: session.user.id,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error("Error creating page:", error);
        return NextResponse.json(
            { error: "Failed to create page" },
            { status: 500 }
        );
    }
}
