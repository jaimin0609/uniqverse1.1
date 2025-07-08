import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { z } from "zod";

const reviewUpdateSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    adminResponse: z.string().optional().nullable(),
    isVerified: z.boolean().optional(),
});

// Get a specific review
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reviewId = resolvedParams.id;

        const review = await db.review.findUnique({
            where: { id: reviewId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: {
                            take: 1,
                            select: { url: true }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });

        if (!review) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        // Log this admin action
        await logAdminAction(
            "review_view",
            `Admin viewed review for product "${review.product.name}" by ${review.user.name || review.user.email}`,
            session.user.id
        );

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error fetching review:", error);
        return NextResponse.json(
            { error: "Failed to fetch review" },
            { status: 500 }
        );
    }
}

// Update a review (moderation)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reviewId = resolvedParams.id;
        const data = await request.json();

        // Validate update data
        const validatedData = reviewUpdateSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if review exists
        const existingReview = await db.review.findUnique({
            where: { id: reviewId },
            include: {
                product: {
                    select: {
                        name: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!existingReview) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {
            ...validatedData.data,
            updatedAt: new Date()
        };

        // If adding an admin response, set the response date
        if (data.adminResponse && !existingReview.adminResponse) {
            updateData.adminResponseDate = new Date();
        }

        // Update the review
        const updatedReview = await db.review.update({
            where: { id: reviewId },
            data: updateData,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Determine what action was taken for the audit log
        let actionType = "review_update";
        let actionDetails = `Admin updated review for "${existingReview.product.name}"`;

        if (data.status === "APPROVED" && existingReview.status !== "APPROVED") {
            actionType = "review_approve";
            actionDetails = `Admin approved review for "${existingReview.product.name}" by ${existingReview.user.name || existingReview.user.email}`;
        } else if (data.status === "REJECTED" && existingReview.status !== "REJECTED") {
            actionType = "review_reject";
            actionDetails = `Admin rejected review for "${existingReview.product.name}" by ${existingReview.user.name || existingReview.user.email}`;
        } else if (data.adminResponse && !existingReview.adminResponse) {
            actionType = "review_respond";
            actionDetails = `Admin responded to review for "${existingReview.product.name}" by ${existingReview.user.name || existingReview.user.email}`;
        }

        // Log this admin action
        await logAdminAction(
            actionType,
            actionDetails,
            session.user.id
        );

        return NextResponse.json(updatedReview);
    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}

// Update a review (moderation) - PUT alias for PATCH
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return PATCH(request, { params });
}

// Delete a review
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reviewId = resolvedParams.id;

        // Check if review exists
        const existingReview = await db.review.findUnique({
            where: { id: reviewId },
            include: {
                product: {
                    select: {
                        name: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!existingReview) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }

        // Delete the review
        await db.review.delete({
            where: { id: reviewId }
        });

        // Log this admin action
        await logAdminAction(
            "review_delete",
            `Admin deleted review for "${existingReview.product.name}" by ${existingReview.user.name || existingReview.user.email}`,
            session.user.id
        );

        return NextResponse.json({
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
}