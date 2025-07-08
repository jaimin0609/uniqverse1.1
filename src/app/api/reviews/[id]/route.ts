import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    images: z.string().optional(),
});

// GET /api/reviews/[id] - Get a specific review
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const review = await db.review.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!review) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            review,
        });
    } catch (error) {
        console.error("Error fetching review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateReviewSchema.parse(body);

        // Find the review and check ownership
        const existingReview = await db.review.findUnique({
            where: { id },
        });

        if (!existingReview) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        if (existingReview.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only edit your own reviews" },
                { status: 403 }
            );
        }

        const updatedReview = await db.review.update({
            where: { id },
            data: {
                ...validatedData,
                status: "PENDING", // Reset to pending on edit
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            review: updatedReview,
            message: "Review updated successfully and is pending approval",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Find the review and check ownership or admin permission
        const existingReview = await db.review.findUnique({
            where: { id },
        });

        if (!existingReview) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        const isOwner = existingReview.userId === session.user.id;
        const isAdmin = session.user.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "You can only delete your own reviews" },
                { status: 403 }
            );
        }

        await db.review.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
