// Products API endpoint tests
import { NextRequest } from 'next/server';
import { GET } from '../products/route';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        product: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

jest.mock('@/lib/redis', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
    },
    cacheKeys: {
        products: jest.fn(),
    },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('/api/products', () => {
    const mockProducts = [
        {
            id: 'product-1',
            name: 'Test Product 1',
            description: 'A great test product',
            price: 19.99,
            compareAtPrice: 29.99,
            inventory: 100,
            status: 'ACTIVE',
            isFeatured: true,
            images: [{ url: 'image1.jpg' }],
            Category: { name: 'Electronics' },
            ProductVariant: [
                {
                    id: 'variant-1',
                    name: 'Red',
                    price: 19.99,
                    inventory: 50,
                },
            ],
            reviews: [
                { rating: 5 },
                { rating: 4 },
            ],
        },
        {
            id: 'product-2',
            name: 'Test Product 2',
            description: 'Another great product',
            price: 39.99,
            compareAtPrice: null,
            inventory: 25,
            status: 'ACTIVE',
            isFeatured: false,
            images: [{ url: 'image2.jpg' }],
            Category: { name: 'Clothing' },
            ProductVariant: [],
            reviews: [
                { rating: 5 },
                { rating: 5 },
                { rating: 4 },
            ],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/products', () => {
        it('should return products with pagination', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProducts as any);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            const request = new NextRequest('http://localhost/api/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.products).toHaveLength(2);
            expect(result.products[0].name).toBe('Test Product 1');
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.pageSize).toBe(20);
        });

        it('should handle pagination parameters', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?page=2&pageSize=10');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: { status: 'ACTIVE' },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 10, // (page 2 - 1) * pageSize 10
                take: 10,
            });
        });

        it('should filter by category', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?category=electronics');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE',
                    Category: {
                        slug: 'electronics',
                    },
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 20,
            });
        });

        it('should filter by price range', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?minPrice=10&maxPrice=50');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE',
                    price: {
                        gte: 10,
                        lte: 50,
                    },
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 20,
            });
        });

        it('should search by query', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?search=test%20product');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { name: { contains: 'test product', mode: 'insensitive' } },
                        { description: { contains: 'test product', mode: 'insensitive' } },
                        { tags: { contains: 'test product', mode: 'insensitive' } },
                    ],
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 20,
            });
        });

        it('should sort by different criteria', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?sortBy=price&sortOrder=desc');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: { status: 'ACTIVE' },
                include: expect.any(Object),
                orderBy: { price: 'desc' },
                skip: 0,
                take: 20,
            });
        });

        it('should filter featured products only', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/products?featured=true');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE',
                    isFeatured: true,
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 20,
            });
        });

        it('should calculate average ratings', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProducts as any);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            const request = new NextRequest('http://localhost/api/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.products[0].averageRating).toBe(4.5); // (5 + 4) / 2
            expect(result.products[0].reviewCount).toBe(2);
            expect(result.products[1].averageRating).toBe(4.67); // (5 + 5 + 4) / 3, rounded
            expect(result.products[1].reviewCount).toBe(3);
        });

        it('should return cached data when available', async () => {
            const cachedData = {
                products: mockProducts,
                pagination: { total: 2, page: 1, pageSize: 20 },
            };
            mockCache.get.mockResolvedValue(cachedData);

            const request = new NextRequest('http://localhost/api/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.products).toHaveLength(2);
            expect(mockDb.product.findMany).not.toHaveBeenCalled();
        });

        it('should handle multiple filters simultaneously', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            const request = new NextRequest(
                'http://localhost/api/products?category=electronics&minPrice=20&maxPrice=100&search=phone&featured=true'
            );
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'ACTIVE',
                    Category: {
                        slug: 'electronics',
                    },
                    price: {
                        gte: 20,
                        lte: 100,
                    },
                    isFeatured: true,
                    OR: [
                        { name: { contains: 'phone', mode: 'insensitive' } },
                        { description: { contains: 'phone', mode: 'insensitive' } },
                        { tags: { contains: 'phone', mode: 'insensitive' } },
                    ],
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 20,
            });
        });

        it('should handle database errors gracefully', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost/api/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.error).toBe('Failed to fetch products');
        });

        it('should validate pagination limits', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(0);

            // Test with extremely large page size
            const request = new NextRequest('http://localhost/api/products?pageSize=1000');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                where: { status: 'ACTIVE' },
                include: expect.any(Object),
                orderBy: expect.any(Object),
                skip: 0,
                take: 100, // Should be capped at maximum
            });
        });

        it('should include product variants and images', async () => {
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProducts as any);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            const request = new NextRequest('http://localhost/api/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.products[0].ProductVariant).toBeDefined();
            expect(result.products[0].ProductVariant).toHaveLength(1);
            expect(result.products[0].images).toBeDefined();
            expect(result.products[0].images).toHaveLength(1);
        });
    });
});
