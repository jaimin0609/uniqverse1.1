import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const createReviewSchema = z.object({
    productId: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    content: z.string().optional(),
    images: z.string().optional(),
});

// GET /api/reviews - Get reviews for a product
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            db.review.findMany({
                where: {
                    productId,
                    status: "APPROVED",
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
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            db.review.count({
                where: {
                    productId,
                    status: "APPROVED",
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = createReviewSchema.parse(body);

        // Check if user has already reviewed this product
        const existingReview = await db.review.findFirst({
            where: {
                productId: validatedData.productId,
                userId: session.user.id,
            },
        });

        if (existingReview) {
            return NextResponse.json(
                { error: "You have already reviewed this product" },
                { status: 400 }
            );
        }

        // Verify that the product exists
        const product = await db.product.findUnique({
            where: { id: validatedData.productId },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if user has purchased this product
        const hasPurchased = await db.orderItem.findFirst({
            where: {
                productId: validatedData.productId,
                order: {
                    userId: session.user.id,
                    status: {
                        in: ["DELIVERED", "COMPLETED"] // Only allow reviews for delivered/completed orders
                    },
                },
            },
        });

        if (!hasPurchased) {
            return NextResponse.json(
                { error: "You can only review products you have purchased and received" },
                { status: 400 }
            );
        }

        const review = await db.review.create({
            data: {
                productId: validatedData.productId,
                userId: session.user.id,
                rating: validatedData.rating,
                title: validatedData.title,
                content: validatedData.content,
                images: validatedData.images,
                status: "PENDING", // Reviews need approval
                isVerified: true, // Mark as verified since user has purchased
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
            review,
            message: "Review submitted successfully and is pending approval",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
