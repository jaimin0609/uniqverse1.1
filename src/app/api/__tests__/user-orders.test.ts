// User orders API endpoint tests
import { NextRequest } from 'next/server';
import { GET } from '../users/orders/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { cache } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        order: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
    },
    cacheKeys: {
        user: jest.fn(),
    },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('/api/users/orders', () => {
    const mockSession = {
        user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
        },
    };

    const mockOrders = [
        {
            id: 'order-1',
            orderNumber: 'ORD-001',
            status: 'DELIVERED',
            total: 50.00,
            createdAt: new Date('2024-01-15'),
            OrderItem: [
                {
                    id: 'item-1',
                    quantity: 2,
                    price: 25.00,
                    Product: {
                        name: 'Test Product',
                        images: [{ url: 'image1.jpg' }],
                    },
                },
            ],
        },
        {
            id: 'order-2',
            orderNumber: 'ORD-002',
            status: 'PENDING',
            total: 75.00,
            createdAt: new Date('2024-01-20'),
            OrderItem: [
                {
                    id: 'item-2',
                    quantity: 1,
                    price: 75.00,
                    Product: {
                        name: 'Another Product',
                        images: [{ url: 'image2.jpg' }],
                    },
                },
            ],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users/orders', () => {
        it('should return user orders with pagination', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue(mockOrders as any);
            (mockDb.order.count as jest.Mock).mockResolvedValue(2);

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.orders).toHaveLength(2);
            expect(result.orders[0].orderNumber).toBe('ORD-001');
            expect(result.pagination.total).toBe(2);
            expect(mockDb.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });

        it('should handle pagination parameters', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.order.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/users/orders?page=2&limit=5');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 5, // (page 2 - 1) * limit 5
                take: 5,
            });
        });

        it('should filter by order status', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.order.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/users/orders?status=DELIVERED');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.order.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    status: 'DELIVERED',
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });

        it('should require authentication', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Authentication required');
            expect(mockDb.order.findMany).not.toHaveBeenCalled();
        });

        it('should return cached data when available', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            const cachedData = {
                orders: mockOrders,
                pagination: { total: 2, page: 1, limit: 10 },
            };
            mockCache.get.mockResolvedValue(cachedData);

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.orders).toHaveLength(2);
            expect(mockDb.order.findMany).not.toHaveBeenCalled();
        });

        it('should handle empty order list', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.order.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.orders).toHaveLength(0);
            expect(result.pagination.total).toBe(0);
        });

        it('should handle database errors gracefully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.error).toBe('Failed to fetch orders');
        });

        it('should validate pagination limits', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.order.count as jest.Mock).mockResolvedValue(0);

            // Test with extremely large limit
            const request = new NextRequest('http://localhost/api/users/orders?limit=1000');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 50, // Should be capped at maximum limit
            });
        });

        it('should include order items and product details', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.order.findMany as jest.Mock).mockResolvedValue(mockOrders as any);
            (mockDb.order.count as jest.Mock).mockResolvedValue(2);

            const request = new NextRequest('http://localhost/api/users/orders');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.orders[0].OrderItem).toBeDefined();
            expect(result.orders[0].OrderItem[0].Product).toBeDefined();
            expect(result.orders[0].OrderItem[0].Product.name).toBe('Test Product');
            expect(mockDb.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: {
                    OrderItem: {
                        include: {
                            Product: {
                                select: {
                                    id: true,
                                    name: true,
                                    images: {
                                        take: 1,
                                        select: { url: true },
                                    },
                                },
                            },
                            ProductVariant: {
                                select: {
                                    name: true,
                                    image: true,
                                    options: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });
    });
});
