import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { cache, cacheKeys, cacheInvalidation } from "@/lib/redis";

// Schema for cart items
const cartItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    variantId: z.string().optional(),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
});

const cartSchema = z.object({
    cartId: z.string().optional(), // Optional for guest carts
    items: z.array(cartItemSchema),
});

// GET - Retrieve a user's cart or create a new one
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const guestCartId = url.searchParams.get("cartId");

        // If user is authenticated, get or create their cart
        if (session?.user?.id) {            // Create cache key for user's cart
            const cacheKey = cacheKeys.user(`cart:${session.user.id}`);

            // Try to get from cache first
            const cached = await cache.get(cacheKey);
            if (cached) {
                return NextResponse.json(cached);
            }
            // Get existing cart or create a new one
            let cart = await db.cart.findUnique({
                where: { userId: session.user.id },
                include: {
                    CartItem: {
                        include: {
                            Product: {
                                select: {
                                    name: true,
                                    price: true,
                                    images: {
                                        take: 1,
                                        select: { url: true }
                                    }
                                }
                            },
                            ProductVariant: {
                                select: {
                                    name: true,
                                    price: true,
                                    image: true,
                                    options: true
                                }
                            }
                        }
                    }
                }
            });

            // If cart doesn't exist, create it
            if (!cart) {
                cart = await db.cart.create({
                    data: {
                        id: uuidv4(),
                        userId: session.user.id,
                        updatedAt: new Date(),
                    },
                    include: {
                        CartItem: {
                            include: {
                                Product: {
                                    select: {
                                        name: true,
                                        price: true,
                                        images: {
                                            take: 1,
                                            select: { url: true }
                                        }
                                    }
                                },
                                ProductVariant: {
                                    select: {
                                        name: true,
                                        price: true,
                                        image: true,
                                        options: true
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Format cart data for client use
            const formattedCartItems = cart.CartItem.map(item => {
                return {
                    id: item.id,
                    productId: item.productId,
                    name: item.Product.name,
                    price: item.ProductVariant?.price || item.Product.price,
                    quantity: item.quantity,
                    image: item.ProductVariant?.image || item.Product.images[0]?.url || "",
                    variantId: item.variantId || undefined,
                    variantName: item.ProductVariant?.name,
                    variantOptions: item.ProductVariant?.options,
                };
            });

            // If there's a guest cart ID and the user's cart is empty, consider merging
            if (guestCartId && formattedCartItems.length === 0) {
                // Look for guest cart items to merge
                const guestCartItems = await db.cartItem.findMany({
                    where: { cartId: guestCartId },
                    include: {
                        Product: {
                            select: {
                                name: true,
                                price: true,
                                images: {
                                    take: 1,
                                    select: { url: true }
                                }
                            }
                        },
                        ProductVariant: {
                            select: {
                                name: true,
                                price: true,
                                image: true,
                                options: true
                            }
                        }
                    }
                });

                // If guest cart items exist, merge them with user cart
                if (guestCartItems.length > 0) {
                    // Transfer items to the user's cart
                    await Promise.all(guestCartItems.map(async (item) => {
                        await db.cartItem.create({
                            data: {
                                id: uuidv4(),
                                cartId: cart!.id,
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity,
                                updatedAt: new Date()
                            }
                        });
                    }));

                    // Delete the guest cart items
                    await db.cartItem.deleteMany({
                        where: { cartId: guestCartId }
                    });

                    // Refetch cart to include the merged items
                    cart = await db.cart.findUnique({
                        where: { userId: session.user.id },
                        include: {
                            CartItem: {
                                include: {
                                    Product: {
                                        select: {
                                            name: true,
                                            price: true,
                                            images: {
                                                take: 1,
                                                select: { url: true }
                                            }
                                        }
                                    },
                                    ProductVariant: {
                                        select: {
                                            name: true,
                                            price: true,
                                            image: true,
                                            options: true
                                        }
                                    }
                                }
                            }
                        }
                    });                    // Reformat cart items after merge
                    const mergedCartItems = cart!.CartItem.map(item => {
                        return {
                            id: item.id,
                            productId: item.productId,
                            name: item.Product.name,
                            price: item.ProductVariant?.price || item.Product.price,
                            quantity: item.quantity,
                            image: item.ProductVariant?.image || item.Product.images[0]?.url || "",
                            variantId: item.variantId || undefined,
                            variantName: item.ProductVariant?.name,
                            variantOptions: item.ProductVariant?.options,
                        };
                    });

                    const mergedResponse = {
                        cartId: cart!.id,
                        items: mergedCartItems,
                        message: "Guest cart merged with user cart"
                    };

                    // Cache the merged cart data
                    await cache.set(cacheKey, mergedResponse, 3600); // Cache for 1 hour

                    return NextResponse.json(mergedResponse);
                }
            }

            const cartResponse = {
                cartId: cart.id,
                items: formattedCartItems
            };

            // Cache the cart data for authenticated users
            await cache.set(cacheKey, cartResponse, 3600); // Cache for 1 hour

            return NextResponse.json(cartResponse);

        } else if (guestCartId) {
            // Handle guest cart retrieval
            const guestCartItems = await db.cartItem.findMany({
                where: { cartId: guestCartId },
                include: {
                    Product: {
                        select: {
                            name: true,
                            price: true,
                            images: {
                                take: 1,
                                select: { url: true }
                            }
                        }
                    },
                    ProductVariant: {
                        select: {
                            name: true,
                            price: true,
                            image: true,
                            options: true
                        }
                    }
                }
            });

            // Format guest cart items
            const formattedGuestItems = guestCartItems.map(item => {
                return {
                    id: item.id,
                    productId: item.productId,
                    name: item.Product.name,
                    price: item.ProductVariant?.price || item.Product.price,
                    quantity: item.quantity,
                    image: item.ProductVariant?.image || item.Product.images[0]?.url || "",
                    variantId: item.variantId || undefined,
                    variantName: item.ProductVariant?.name,
                    variantOptions: item.ProductVariant?.options,
                };
            });

            return NextResponse.json({
                cartId: guestCartId,
                items: formattedGuestItems
            });

        } else {
            // Create a new guest cart ID if one wasn't provided
            const newGuestCartId = uuidv4();

            return NextResponse.json({
                cartId: newGuestCartId,
                items: []
            });
        }

    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json(
            { message: "Failed to fetch cart" },
            { status: 500 }
        );
    }
}

// POST - Update cart with new items
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();

        // Validate input
        const validationResult = cartSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid cart data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { cartId: providedCartId, items } = validationResult.data;

        // Determine cart ID to use
        let cartId: string;

        if (session?.user?.id) {
            // For authenticated users, get or create their cart
            let userCart = await db.cart.findUnique({
                where: { userId: session.user.id }
            });

            if (!userCart) {
                userCart = await db.cart.create({
                    data: {
                        id: uuidv4(),
                        userId: session.user.id,
                        updatedAt: new Date()
                    }
                });
            }

            cartId = userCart.id;
        } else if (providedCartId) {
            // For guests, use the provided cart ID
            cartId = providedCartId;
        } else {
            // If no cart ID was provided for a guest, create a new one
            cartId = uuidv4();
        }

        // Delete existing cart items
        await db.cartItem.deleteMany({
            where: { cartId }
        });

        // Validate that all products exist before adding them
        for (const item of items) {
            const product = await db.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                return NextResponse.json(
                    { message: `Product with ID ${item.productId} not found` },
                    { status: 404 }
                );
            }

            // If variant is provided, validate it exists
            if (item.variantId) {
                const variant = await db.productVariant.findUnique({
                    where: {
                        id: item.variantId,
                        productId: item.productId
                    }
                });

                if (!variant) {
                    return NextResponse.json(
                        { message: `Variant with ID ${item.variantId} not found for product ${item.productId}` },
                        { status: 404 }
                    );
                }
            }
        }

        // Add new cart items
        if (items.length > 0) {
            await Promise.all(items.map(async (item) => {
                await db.cartItem.create({
                    data: {
                        id: uuidv4(),
                        cartId,
                        productId: item.productId,
                        variantId: item.variantId || null,
                        quantity: item.quantity,
                        updatedAt: new Date()
                    }
                });
            }));
        }

        // Fetch updated cart with product details
        const updatedCartItems = await db.cartItem.findMany({
            where: { cartId },
            include: {
                Product: {
                    select: {
                        name: true,
                        price: true,
                        images: {
                            take: 1,
                            select: { url: true }
                        }
                    }
                },
                ProductVariant: {
                    select: {
                        name: true,
                        price: true,
                        image: true,
                        options: true
                    }
                }
            }
        });        // Format cart items
        const formattedCartItems = updatedCartItems.map(item => {
            return {
                id: item.id,
                productId: item.productId,
                name: item.Product.name,
                price: item.ProductVariant?.price || item.Product.price,
                quantity: item.quantity,
                image: item.ProductVariant?.image || item.Product.images[0]?.url || "",
                variantId: item.variantId || undefined,
                variantName: item.ProductVariant?.name,
                variantOptions: item.ProductVariant?.options,
            };
        });

        // Invalidate cache for authenticated users
        if (session?.user?.id) {
            const cacheKey = cacheKeys.user(`cart:${session.user.id}`);
            await cache.del(cacheKey);
        }

        return NextResponse.json({
            message: "Cart updated successfully",
            cartId,
            items: formattedCartItems
        });

    } catch (error) {
        console.error("Error updating cart:", error);
        return NextResponse.json(
            { message: "Failed to update cart" },
            { status: 500 }
        );
    }
}

// DELETE - Clear cart
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const providedCartId = url.searchParams.get("cartId");

        if (!session?.user?.id && !providedCartId) {
            return NextResponse.json(
                { message: "Cart ID is required for guest users" },
                { status: 400 }
            );
        }

        let cartId: string | undefined;

        if (session?.user?.id) {
            // For authenticated users, get their cart ID
            const userCart = await db.cart.findUnique({
                where: { userId: session.user.id },
                select: { id: true }
            });

            cartId = userCart?.id;
        } else {
            // For guests, use the provided cart ID
            cartId = providedCartId || undefined;
        } if (cartId) {
            // Delete all items in the cart
            await db.cartItem.deleteMany({
                where: { cartId }
            });

            // Invalidate cache for authenticated users
            if (session?.user?.id) {
                const cacheKey = cacheKeys.user(`cart:${session.user.id}`);
                await cache.del(cacheKey);
            }

            return NextResponse.json({
                message: "Cart cleared successfully",
                cartId
            });
        } else {
            return NextResponse.json(
                { message: "Cart not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Error clearing cart:", error);
        return NextResponse.json(
            { message: "Failed to clear cart" },
            { status: 500 }
        );
    }
}