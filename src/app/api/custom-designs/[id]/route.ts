import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for custom design updates
const updateDesignSchema = z.object({
    designData: z.string().min(1, "Design data is required"),
    previewUrl: z.string().optional().nullable(),
    pricing: z.object({
        additionalPrice: z.number().nonnegative(),
        breakdown: z.record(z.number()).optional()
    }).optional()
});

// GET - Retrieve a specific custom design
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const designId = params.id;

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

        // Retrieve the custom design
        const customDesign = await db.customDesign.findFirst({
            where: {
                id: designId,
                userId: user.id // Ensure user can only access their own designs
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        customizationTemplate: true,
                        printArea: true
                    }
                }
            }
        });

        if (!customDesign) {
            return NextResponse.json(
                { error: "Custom design not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { design: customDesign },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error retrieving custom design:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update a custom design
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const designId = params.id;
        const body = await req.json();
        const validatedData = updateDesignSchema.parse(body);

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

        // Check if the design exists and belongs to the user
        const existingDesign = await db.customDesign.findFirst({
            where: {
                id: designId,
                userId: user.id
            }
        });

        if (!existingDesign) {
            return NextResponse.json(
                { error: "Custom design not found" },
                { status: 404 }
            );
        }        // Update the custom design
        const updatedDesign = await db.customDesign.update({
            where: { id: designId },
            data: {
                designData: validatedData.designData,
                previewImageUrl: validatedData.previewUrl,
                metadata: validatedData.pricing ? JSON.stringify(validatedData.pricing) : null,
                updatedAt: new Date()
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true
                    }
                }
            }
        });

        return NextResponse.json(
            {
                message: "Custom design updated successfully",
                design: updatedDesign
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating custom design:", error);

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

// DELETE - Delete a custom design
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const designId = params.id;

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

        // Check if the design exists and belongs to the user
        const existingDesign = await db.customDesign.findFirst({
            where: {
                id: designId,
                userId: user.id
            }
        });

        if (!existingDesign) {
            return NextResponse.json(
                { error: "Custom design not found" },
                { status: 404 }
            );
        }

        // Delete the custom design
        await db.customDesign.delete({
            where: { id: designId }
        });

        return NextResponse.json(
            { message: "Custom design deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting custom design:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
