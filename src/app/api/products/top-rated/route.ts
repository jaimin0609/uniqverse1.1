import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "8");
        const minRating = parseFloat(searchParams.get("minRating") || "4.0");
        const minReviews = parseInt(searchParams.get("minReviews") || "2");

        const products = await db.product.findMany({
            where: {
                isPublished: true,
                reviews: {
                    some: {
                        status: 'APPROVED'
                    }
                }
            },
            include: {
                images: {
                    where: {
                        position: 0
                    },
                    take: 1
                },
                category: {
                    select: {
                        name: true,
                        slug: true
                    }
                },
                reviews: {
                    where: {
                        status: 'APPROVED'
                    },
                    select: {
                        rating: true
                    }
                }
            },
            take: Math.min(limit * 3, 100) // Get more products to calculate averages
        });

        // Calculate average ratings and filter products with good ratings
        const productsWithRatings = products
            .map(product => {
                const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
                const averageRating = product.reviews.length > 0 ? totalRatings / product.reviews.length : 0;
                const reviewCount = product.reviews.length;

                return {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    images: product.images,
                    category: product.category,
                    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                    reviewCount
                };
            })
            .filter(product => product.averageRating >= minRating && product.reviewCount >= minReviews)
            .sort((a, b) => {
                // Sort by average rating first, then by review count
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating;
                }
                return b.reviewCount - a.reviewCount;
            })
            .slice(0, limit);

        return NextResponse.json({
            success: true,
            products: productsWithRatings,
            total: productsWithRatings.length
        });

    } catch (error) {
        console.error("Error fetching top-rated products:", error);
        return NextResponse.json(
            { error: "Failed to fetch top-rated products" },
            { status: 500 }
        );
    }
}
