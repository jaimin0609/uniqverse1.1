import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET /api/reviews/can-review - Check if user can review a product
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                canReview: false,
                reason: "AUTHENTICATION_REQUIRED",
                message: "You must be logged in to write reviews"
            });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product exists
        const product = await db.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json({
                canReview: false,
                reason: "PRODUCT_NOT_FOUND",
                message: "Product not found"
            });
        }

        // Check if user has already reviewed this product
        const existingReview = await db.review.findFirst({
            where: {
                productId,
                userId: session.user.id,
            },
        });

        if (existingReview) {
            return NextResponse.json({
                canReview: false,
                reason: "ALREADY_REVIEWED",
                message: "You have already reviewed this product",
                existingReview: {
                    id: existingReview.id,
                    rating: existingReview.rating,
                    title: existingReview.title,
                    content: existingReview.content,
                    status: existingReview.status,
                    createdAt: existingReview.createdAt,
                }
            });
        }

        // Check if user has purchased this product
        const hasPurchased = await db.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId: session.user.id,
                    status: {
                        in: ["DELIVERED", "COMPLETED"]
                    },
                },
            },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        status: true,
                        createdAt: true,
                    }
                }
            }
        });

        if (!hasPurchased) {
            return NextResponse.json({
                canReview: false,
                reason: "NOT_PURCHASED",
                message: "You can only review products you have purchased and received"
            });
        }

        return NextResponse.json({
            canReview: true,
            reason: "ELIGIBLE",
            message: "You can write a review for this product",
            purchaseInfo: {
                orderNumber: hasPurchased.order.orderNumber,
                orderStatus: hasPurchased.order.status,
                purchaseDate: hasPurchased.order.createdAt,
            }
        });

    } catch (error) {
        console.error("Error checking review eligibility:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
