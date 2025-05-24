import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;

        const category = await db.blogCategory.findFirst({
            where: {
                slug,
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}
