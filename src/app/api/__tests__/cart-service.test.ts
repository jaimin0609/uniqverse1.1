// Cart API service tests
import { getCart, addToCart, removeFromCart, updateCartItem, CartItem } from './cart-service';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        cartItem: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
        },
    },
}));

// Import after mocking
import { db } from '@/lib/db';

// Create properly typed mocks
const mockDb = db as jest.Mocked<typeof db>;

describe('Cart API Service', () => {
    const userId = 'user-1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCart', () => {
        it('should return empty cart if none exists', async () => {
            // Mock no cart found
            (mockDb.cart.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await getCart(userId);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.cart).toEqual({ id: null, items: [] });
            expect(result.message).toBe('Cart is empty');
        });

        it('should return cart with items', async () => {
            // Mock cart with items
            (mockDb.cart.findUnique as jest.Mock).mockResolvedValue({
                id: 'cart-1',
                userId,
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        product: {
                            id: 'product-1',
                            name: 'Test Product',
                            price: 9.99,
                            images: ['image1.jpg'],
                            inventory: 10,
                        },
                    },
                ],
            });

            const result = await getCart(userId);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.cart.id).toBe('cart-1');
            expect(result.cart.items).toHaveLength(1);
            expect(result.cart.items[0].productId).toBe('product-1');
            expect(result.cart.items[0].quantity).toBe(2);
        });

        it('should handle database errors', async () => {
            (mockDb.cart.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

            try {
                await getCart(userId);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('addToCart', () => {
        const cartItem: CartItem = {
            productId: 'product-1',
            quantity: 2,
        };

        it('should add new item to cart', async () => {
            // Mock product exists with enough inventory
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue({
                id: 'product-1',
                inventory: 10,
            });

            // Mock cart exists
            (mockDb.cart.findUnique as jest.Mock).mockResolvedValue({
                id: 'cart-1',
                userId,
            });

            // Mock item doesn't exist in cart yet
            (mockDb.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await addToCart(userId, cartItem);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Item added to cart');
            expect(mockDb.cartItem.create).toHaveBeenCalledWith({
                data: {
                    cartId: 'cart-1',
                    productId: 'product-1',
                    quantity: 2,
                },
            });
        });

        it('should update quantity for existing cart item', async () => {
            // Mock product exists with enough inventory
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue({
                id: 'product-1',
                inventory: 10,
            });

            // Mock cart exists
            (mockDb.cart.findUnique as jest.Mock).mockResolvedValue({
                id: 'cart-1',
                userId,
            });

            // Mock item exists in cart
            (mockDb.cartItem.findUnique as jest.Mock).mockResolvedValue({
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'product-1',
                quantity: 1,
            });

            const result = await addToCart(userId, cartItem);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item-1' },
                data: { quantity: 3 }, // 1 + 2
            });
        });

        it('should return error if product not found', async () => {
            // Mock product not found
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await addToCart(userId, cartItem);

            expect(result.status).toBe(404);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Product not found');
            expect(mockDb.cartItem.create).not.toHaveBeenCalled();
        });

        it('should return error if insufficient inventory', async () => {
            // Mock product exists with insufficient inventory
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue({
                id: 'product-1',
                inventory: 1, // Less than requested quantity of 2
            });

            const result = await addToCart(userId, cartItem);

            expect(result.status).toBe(400);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Not enough inventory');
            expect(mockDb.cartItem.create).not.toHaveBeenCalled();
        });
    });

    describe('removeFromCart and updateCartItem', () => {
        // Add similar tests for these functions
        it('should remove item from cart', async () => {
            const cartItemId = 'item-1';

            // Mock item exists and belongs to user's cart
            (mockDb.cartItem.findUnique as jest.Mock).mockResolvedValue({
                id: cartItemId,
                cartId: 'cart-1',
                productId: 'product-1',
                quantity: 2,
                cart: {
                    id: 'cart-1',
                    userId,
                },
            });

            const result = await removeFromCart(userId, cartItemId);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.delete).toHaveBeenCalledWith({
                where: { id: cartItemId },
            });
        });

        it('should update cart item quantity', async () => {
            const cartItemId = 'item-1';
            const newQuantity = 5;

            // Mock item exists and belongs to user's cart
            (mockDb.cartItem.findUnique as jest.Mock).mockResolvedValue({
                id: cartItemId,
                cartId: 'cart-1',
                productId: 'product-1',
                quantity: 2,
                cart: {
                    id: 'cart-1',
                    userId,
                },
                product: {
                    id: 'product-1',
                    inventory: 10, // Enough inventory
                },
            });

            const result = await updateCartItem(userId, cartItemId, newQuantity);

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.update).toHaveBeenCalledWith({
                where: { id: cartItemId },
                data: { quantity: newQuantity },
            });
        });

        it('should return error for invalid quantity', async () => {
            const cartItemId = 'item-1';
            const invalidQuantity = 0;

            const result = await updateCartItem(userId, cartItemId, invalidQuantity);

            expect(result.status).toBe(400);
            expect(result.success).toBe(false);
            expect(mockDb.cartItem.update).not.toHaveBeenCalled();
        });
    });
});
