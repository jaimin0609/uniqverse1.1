// Cart service module for testing
import { db } from '@/lib/db';

export type CartItem = {
    productId: string;
    quantity: number;
    price?: number;
};

export async function getCart(userId: string) {
    try {
        // Find or create cart
        let cart = await db.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true,
                                inventory: true,
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            return {
                success: true,
                cart: { id: null, items: [] },
                message: 'Cart is empty',
                status: 200
            };
        }

        return {
            success: true,
            cart: {
                id: cart.id,
                items: cart.items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price,
                    product: item.product,
                })),
            },
            status: 200
        };
    } catch (error) {
        console.error('Get cart error:', error);
        throw error;
    }
}

export async function addToCart(userId: string, item: CartItem) {
    try {
        // Validate product exists
        const product = await db.product.findUnique({
            where: { id: item.productId },
        });

        if (!product) {
            return {
                success: false,
                message: 'Product not found',
                status: 404
            };
        }

        // Check inventory
        if (product.inventory < item.quantity) {
            return {
                success: false,
                message: 'Not enough inventory',
                status: 400
            };
        }

        // Find or create cart
        let cart = await db.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await db.cart.create({
                data: { userId },
            });
        }

        // Check if product is already in cart
        const existingItem = await db.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: item.productId,
                },
            },
        });

        if (existingItem) {
            // Update quantity
            await db.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + item.quantity },
            });
        } else {
            // Add new item
            await db.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: item.productId,
                    quantity: item.quantity,
                },
            });
        }

        return {
            success: true,
            message: 'Item added to cart',
            status: 200
        };
    } catch (error) {
        console.error('Add to cart error:', error);
        throw error;
    }
}

export async function removeFromCart(userId: string, cartItemId: string) {
    try {
        // Verify user owns the cart that contains this item
        const cartItem = await db.cartItem.findUnique({
            where: { id: cartItemId },
            include: { cart: true },
        });

        if (!cartItem) {
            return {
                success: false,
                message: 'Cart item not found',
                status: 404
            };
        }

        if (cartItem.cart.userId !== userId) {
            return {
                success: false,
                message: 'Not authorized',
                status: 403
            };
        }

        // Delete the item
        await db.cartItem.delete({
            where: { id: cartItemId },
        });

        return {
            success: true,
            message: 'Item removed from cart',
            status: 200
        };
    } catch (error) {
        console.error('Remove from cart error:', error);
        throw error;
    }
}

export async function updateCartItem(userId: string, cartItemId: string, quantity: number) {
    try {
        if (quantity <= 0) {
            return {
                success: false,
                message: 'Quantity must be greater than 0',
                status: 400
            };
        }

        // Verify user owns the cart that contains this item
        const cartItem = await db.cartItem.findUnique({
            where: { id: cartItemId },
            include: {
                cart: true,
                product: true
            },
        });

        if (!cartItem) {
            return {
                success: false,
                message: 'Cart item not found',
                status: 404
            };
        }

        if (cartItem.cart.userId !== userId) {
            return {
                success: false,
                message: 'Not authorized',
                status: 403
            };
        }

        // Check inventory
        if (cartItem.product.inventory < quantity) {
            return {
                success: false,
                message: 'Not enough inventory',
                status: 400
            };
        }

        // Update quantity
        await db.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
        });

        return {
            success: true,
            message: 'Cart item updated',
            status: 200
        };
    } catch (error) {
        console.error('Update cart item error:', error);
        throw error;
    }
}
