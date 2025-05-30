import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { cache } from "@/lib/redis";

// Schema for adding to wishlist
const wishlistItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
});

// GET - Get all products in user's wishlist
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        const cacheKey = `user:wishlist:${session.user.id}`;

        // Try to get from cache first
        const cachedWishlist = await cache.get(cacheKey);
        if (cachedWishlist) {
            return NextResponse.json({ products: cachedWishlist });
        }

        const user = await db.user.findUnique({
            where: {
                id: session.user.id
            },
            include: {
                Product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        compareAtPrice: true,
                        inventory: true,
                        images: {
                            take: 1,
                            select: {
                                url: true
                            }
                        },
                        variants: {
                            take: 1
                        },
                        category: {
                            select: {
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }        // Format wishlist items
        const wishlistItems = user.Product.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            inventory: product.inventory,
            image: product.images[0]?.url || "",
            hasVariants: product.variants.length > 0,
            category: {
                name: product.category.name,
                slug: product.category.slug
            },
            addedAt: new Date() // Unfortunately, we don't store the time when item was added to wishlist
        }));

        // Cache wishlist for 1 hour
        await cache.set(cacheKey, wishlistItems, 3600);

        return NextResponse.json({
            message: "Wishlist retrieved successfully",
            wishlistItems,
            count: wishlistItems.length
        });

    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return NextResponse.json(
            { message: "Failed to fetch wishlist" },
            { status: 500 }
        );
    }
}

// POST - Add product to wishlist
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validationResult = wishlistItemSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid product data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { productId } = validationResult.data;

        // Check if product exists
        const product = await db.product.findUnique({
            where: {
                id: productId
            }
        });

        if (!product) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        // Check if product is already in wishlist
        const isInWishlist = await db.user.findFirst({
            where: {
                id: session.user.id,
                Product: {
                    some: {
                        id: productId
                    }
                }
            }
        });

        if (isInWishlist) {
            return NextResponse.json({
                message: "Product is already in your wishlist",
                added: false
            });
        }        // Add product to wishlist
        await db.user.update({
            where: {
                id: session.user.id
            },
            data: {
                Product: {
                    connect: {
                        id: productId
                    }
                }
            }
        });

        // Invalidate wishlist cache
        const cacheKey = `user:wishlist:${session.user.id}`;
        await cache.del(cacheKey);

        return NextResponse.json({
            message: "Product added to wishlist",
            added: true,
            productId
        });

    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return NextResponse.json(
            { message: "Failed to add to wishlist" },
            { status: 500 }
        );
    }
}

// DELETE - Remove product from wishlist
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const productId = url.searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { message: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product is in wishlist
        const isInWishlist = await db.user.findFirst({
            where: {
                id: session.user.id,
                Product: {
                    some: {
                        id: productId
                    }
                }
            }
        });

        if (!isInWishlist) {
            return NextResponse.json(
                { message: "Product is not in your wishlist" },
                { status: 404 }
            );
        }        // Remove product from wishlist
        await db.user.update({
            where: {
                id: session.user.id
            },
            data: {
                Product: {
                    disconnect: {
                        id: productId
                    }
                }
            }
        });

        // Invalidate wishlist cache
        const cacheKey = `user:wishlist:${session.user.id}`;
        await cache.del(cacheKey);

        return NextResponse.json({
            message: "Product removed from wishlist",
            removed: true,
            productId
        });

    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return NextResponse.json(
            { message: "Failed to remove from wishlist" },
            { status: 500 }
        );
    }
}