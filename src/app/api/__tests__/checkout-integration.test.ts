// Integration tests for the checkout flow
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { createPaymentIntent } from '@/lib/stripe';

// Import API route handlers
import { POST as addToCart } from '../cart/route';
import { POST as createOrder } from '../orders/route';
import { POST as validateCoupon } from '../coupons/validate/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        cartItem: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        productVariant: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        order: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        orderItem: {
            createMany: jest.fn(),
        },
        coupon: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
    createPaymentIntent: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    },
    cacheKeys: {
        user: jest.fn(),
    },
    cacheInvalidation: {
        invalidateUserCache: jest.fn(),
    },
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreatePaymentIntent = createPaymentIntent as jest.MockedFunction<typeof createPaymentIntent>;

describe('Checkout Flow Integration Tests', () => {
    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
    };

    const mockSession = {
        user: mockUser,
    };

    const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 25.00,
        inventory: 100,
        status: 'ACTIVE',
    };

    const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        updatedAt: new Date(),
        CartItem: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue(mockSession as any);
    });

    describe('Complete Checkout Flow', () => {
        it('should complete full checkout flow successfully', async () => {
            // Step 1: Add product to cart
            (mockDb.cart.findUnique as jest.Mock).mockResolvedValue(mockCart as any);
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(mockProduct as any);
            (mockDb.cartItem.findUnique as jest.Mock).mockResolvedValue(null); // No existing cart item
            (mockDb.cartItem.create as jest.Mock).mockResolvedValue({
                id: 'cart-item-1',
                cartId: 'cart-1',
                productId: 'product-1',
                quantity: 2,
            } as any);

            const addToCartRequest = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify({
                    items: [{ productId: 'product-1', quantity: 2 }],
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const cartResponse = await addToCart(addToCartRequest);
            const cartResult = await cartResponse.json();

            expect(cartResponse.status).toBe(200);
            expect(cartResult.success).toBe(true);

            // Step 2: Create order from cart
            const mockOrder = {
                id: 'order-1',
                orderNumber: 'ORD-001',
                userId: 'user-1',
                status: 'PENDING',
                subtotal: 50.00,
                shippingCost: 5.00,
                tax: 4.00,
                total: 59.00,
            };

            (mockDb.order.create as jest.Mock).mockResolvedValue(mockOrder as any);
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_123',
            } as any);

            const orderData = {
                items: [
                    {
                        productId: 'product-1',
                        quantity: 2,
                        price: 25.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'standard',
                paymentMethod: 'stripe',
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(200);
            expect(orderResult.success).toBe(true);
            expect(orderResult.order.id).toBe('order-1');
            expect(orderResult.clientSecret).toBe('pi_test_123');

            // Verify product inventory was updated
            expect(mockDb.product.update).toHaveBeenCalledWith({
                where: { id: 'product-1' },
                data: { inventory: { decrement: 2 } },
            });

            // Verify order was created with correct data
            expect(mockDb.order.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-1',
                    status: 'PENDING',
                    subtotal: 50.00,
                    total: 59.00,
                }),
            });
        });

        it('should handle checkout with coupon discount', async () => {
            // Step 1: Validate coupon
            const mockCoupon = {
                id: 'coupon-1',
                code: 'SAVE10',
                discountType: 'PERCENTAGE',
                discountValue: 10,
                isActive: true,
                usageLimit: 100,
                usageCount: 5,
                expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
            };

            (mockDb.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon as any);

            const couponRequest = new NextRequest('http://localhost/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({
                    code: 'SAVE10',
                    subtotal: 50.00,
                    currency: 'USD',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const couponResponse = await validateCoupon(couponRequest);
            const couponResult = await couponResponse.json();

            expect(couponResponse.status).toBe(200);
            expect(couponResult.valid).toBe(true);
            expect(couponResult.discount).toBe(5.00); // 10% of $50

            // Step 2: Create order with discount
            const mockDiscountedOrder = {
                id: 'order-1',
                orderNumber: 'ORD-001',
                userId: 'user-1',
                status: 'PENDING',
                subtotal: 50.00,
                discount: 5.00,
                shippingCost: 5.00,
                tax: 4.00,
                total: 54.00, // 50 - 5 + 5 + 4
            };

            (mockDb.order.create as jest.Mock).mockResolvedValue(mockDiscountedOrder as any);
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_456',
            } as any);

            const orderData = {
                items: [
                    {
                        productId: 'product-1',
                        quantity: 2,
                        price: 25.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'standard',
                couponCode: 'SAVE10',
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(200);
            expect(orderResult.success).toBe(true);
            expect(orderResult.order.total).toBe(54.00);

            // Verify coupon usage was incremented
            expect(mockDb.coupon.update).toHaveBeenCalledWith({
                where: { id: 'coupon-1' },
                data: { usageCount: { increment: 1 } },
            });
        });

        it('should handle inventory validation during checkout', async () => {
            // Product with limited inventory
            const limitedProduct = {
                id: 'product-2',
                name: 'Limited Product',
                price: 100.00,
                inventory: 1, // Only 1 in stock
                status: 'ACTIVE',
            };

            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(limitedProduct as any);

            const orderData = {
                items: [
                    {
                        productId: 'product-2',
                        quantity: 2, // Requesting more than available
                        price: 100.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'standard',
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(400);
            expect(orderResult.message).toContain('insufficient inventory');
            expect(mockDb.order.create).not.toHaveBeenCalled();
        });

        it('should handle product variant checkout', async () => {
            const mockProductWithVariants = {
                id: 'product-3',
                name: 'Variant Product',
                price: 30.00,
                inventory: 50,
                status: 'ACTIVE',
            };

            const mockVariant = {
                id: 'variant-1',
                productId: 'product-3',
                name: 'Red - Large',
                price: 32.00,
                inventory: 10,
                options: { color: 'red', size: 'large' },
            };

            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(mockProductWithVariants as any);
            (mockDb.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant as any);

            const mockOrder = {
                id: 'order-2',
                orderNumber: 'ORD-002',
                userId: 'user-1',
                status: 'PENDING',
                subtotal: 64.00, // 2 × $32
                shippingCost: 5.00,
                tax: 5.52,
                total: 74.52,
            };

            (mockDb.order.create as jest.Mock).mockResolvedValue(mockOrder as any);
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_789',
            } as any);

            const orderData = {
                items: [
                    {
                        productId: 'product-3',
                        variantId: 'variant-1',
                        quantity: 2,
                        price: 32.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'standard',
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(200);
            expect(orderResult.success).toBe(true);
            expect(orderResult.order.subtotal).toBe(64.00);

            // Verify variant inventory was updated
            expect(mockDb.productVariant.update).toHaveBeenCalledWith({
                where: { id: 'variant-1' },
                data: { inventory: { decrement: 2 } },
            });
        });

        it('should handle shipping method calculations', async () => {
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(mockProduct as any);

            // Test express shipping
            const mockOrderExpress = {
                id: 'order-3',
                orderNumber: 'ORD-003',
                userId: 'user-1',
                status: 'PENDING',
                subtotal: 25.00,
                shippingCost: 12.00, // Express shipping
                tax: 2.96,
                total: 39.96,
            };

            (mockDb.order.create as jest.Mock).mockResolvedValue(mockOrderExpress as any);
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_express',
            } as any);

            const orderData = {
                items: [
                    {
                        productId: 'product-1',
                        quantity: 1,
                        price: 25.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'express', // Express shipping
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(200);
            expect(orderResult.order.shippingCost).toBe(12.00);
            expect(orderResult.order.total).toBe(39.96);
        });

        it('should handle payment intent creation failure', async () => {
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(mockProduct as any);
            (mockDb.order.create as jest.Mock).mockResolvedValue({
                id: 'order-4',
                total: 59.00,
            } as any);

            // Simulate Stripe failure
            mockCreatePaymentIntent.mockRejectedValue(new Error('Stripe API error'));

            const orderData = {
                items: [
                    {
                        productId: 'product-1',
                        quantity: 2,
                        price: 25.00,
                    },
                ],
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    zipCode: '12345',
                    country: 'US',
                },
                shippingMethod: 'standard',
            };

            const orderRequest = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
            });

            const orderResponse = await createOrder(orderRequest);
            const orderResult = await orderResponse.json();

            expect(orderResponse.status).toBe(500);
            expect(orderResult.message).toContain('payment processing');
        });
    });
});
