import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for custom design creation
const customDesignSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    designData: z.string().min(1, "Design data is required"),
    previewUrl: z.string().optional().nullable(),
    pricing: z.object({
        additionalPrice: z.number().nonnegative(),
        breakdown: z.record(z.number()).optional()
    }).optional()
});

// POST - Save a custom design
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validatedData = customDesignSchema.parse(body);

        // Get the user from the database
        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify the product exists and is customizable
        const product = await db.product.findUnique({
            where: { id: validatedData.productId },
            select: { isCustomizable: true }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        if (!product.isCustomizable) {
            return NextResponse.json(
                { error: "Product is not customizable" },
                { status: 400 }
            );
        }        // Create the custom design
        const customDesign = await db.customDesign.create({
            data: {
                productId: validatedData.productId,
                userId: user.id,
                designData: validatedData.designData,
                previewImageUrl: validatedData.previewUrl,
                metadata: validatedData.pricing ? JSON.stringify(validatedData.pricing) : null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return NextResponse.json(
            {
                message: "Custom design saved successfully",
                designId: customDesign.id
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error saving custom design:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET - Retrieve user's custom designs
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const productId = url.searchParams.get("productId");

        // Get the user from the database
        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Build the where clause
        const whereClause: any = {
            userId: user.id
        };

        if (productId) {
            whereClause.productId = productId;
        }

        // Retrieve custom designs
        const customDesigns = await db.customDesign.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(
            { designs: customDesigns },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error retrieving custom designs:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
