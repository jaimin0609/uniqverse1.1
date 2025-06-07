// Orders API endpoint tests
import { NextRequest } from 'next/server';
import { POST } from '../orders/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { createPaymentIntent } from '@/lib/stripe';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        order: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        orderItem: {
            create: jest.fn(),
            createMany: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        cart: {
            delete: jest.fn(),
        },
        cartItem: {
            deleteMany: jest.fn(),
        },
    },
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
    createPaymentIntent: jest.fn(),
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-order-uuid'),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreatePaymentIntent = createPaymentIntent as jest.MockedFunction<typeof createPaymentIntent>;

describe('/api/orders', () => {
    const mockSession = {
        user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
        },
    };

    const orderData = {
        items: [
            {
                productId: 'product-1',
                quantity: 2,
                price: 10.99,
            },
            {
                productId: 'product-2',
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
        shippingMethod: 'standard',
        paymentMethod: 'stripe',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/orders', () => {
        it('should create order successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);            // Mock products
            (mockDb.product.findUnique as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'product-1',
                    name: 'Product 1',
                    price: 10.99,
                    inventory: 10,
                } as any)
                .mockResolvedValueOnce({
                    id: 'product-2',
                    name: 'Product 2',
                    price: 25.00,
                    inventory: 5,
                } as any);

            // Mock order creation
            const mockOrder = {
                id: 'mock-order-uuid',
                orderNumber: 'ORD-001',
                userId: 'user-1',
                status: 'PENDING',
                subtotal: 46.98,
                shippingCost: 5,
                total: 51.98,
            };
            (mockDb.order.create as jest.Mock).mockResolvedValue(mockOrder as any);

            // Mock payment intent
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_123',
            } as any);

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.order.id).toBe('mock-order-uuid');
            expect(result.clientSecret).toBe('pi_test_123');
            expect(mockDb.order.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    id: 'mock-order-uuid',
                    userId: 'user-1',
                    status: 'PENDING',
                    subtotal: 46.98,
                    total: 51.98,
                }),
            });
        });

        it('should require authentication', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.message).toBe('User authentication required');
        });

        it('should validate required items', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);

            const invalidData = {
                ...orderData,
                items: [], // Empty items
            };

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(invalidData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('No items provided');
        });

        it('should calculate shipping costs correctly', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any); (mockDb.product.findUnique as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'product-1',
                    price: 10.99,
                    inventory: 10,
                } as any);

            (mockDb.order.create as jest.Mock).mockResolvedValue({
                id: 'mock-order-uuid',
                total: 27.99, // 10.99 + 2 + 12 (express) + 3 (tax)
            } as any);

            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_123',
            } as any);

            const expressShippingData = {
                ...orderData,
                items: [{ productId: 'product-1', quantity: 1, price: 10.99 }],
                shippingMethod: 'express',
            };

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(expressShippingData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(mockDb.order.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    shippingCost: 12, // Express shipping
                }),
            });
        });

        it('should handle product validation errors', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(null); // Product not found

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toContain('Product not found');
        });

        it('should handle inventory validation', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);

            (mockDb.product.findUnique as jest.Mock).mockResolvedValue({
                id: 'product-1',
                inventory: 1, // Less than requested quantity of 2
            } as any);

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toContain('insufficient inventory');
        });

        it('should handle payment intent creation failure', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);

            (mockDb.product.findUnique as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'product-1',
                    inventory: 10,
                } as any)
                .mockResolvedValueOnce({
                    id: 'product-2',
                    inventory: 5,
                } as any);

            (mockDb.order.create as jest.Mock).mockResolvedValue({
                id: 'mock-order-uuid',
                total: 51.98,
            } as any);

            mockCreatePaymentIntent.mockRejectedValue(new Error('Stripe error'));

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.message).toContain('payment processing');
        });

        it('should handle database errors gracefully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            (mockDb.product.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.message).toBe('Failed to create order');
        });
    });
});
