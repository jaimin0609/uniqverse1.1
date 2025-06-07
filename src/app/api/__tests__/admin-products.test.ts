// Admin products API endpoint tests
import { NextRequest } from 'next/server';
import { GET, POST } from '../admin/products/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { cache, cacheInvalidation } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        product: {
            findMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        category: {
            findUnique: jest.fn(),
        },
        supplier: {
            findUnique: jest.fn(),
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
    cacheInvalidation: {
        invalidateProductCache: jest.fn(),
    },
}));

jest.mock('@/lib/admin-utils', () => ({
    logAdminAction: jest.fn(),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('/api/admin/products', () => {
    const mockAdminSession = {
        user: {
            id: 'admin-1',
            email: 'admin@example.com',
            role: 'ADMIN',
        },
    };

    const mockUserSession = {
        user: {
            id: 'user-1',
            email: 'user@example.com',
            role: 'USER',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/products', () => {
        it('should return products for admin user', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            mockCache.get.mockResolvedValue(null);

            const mockProducts = [
                {
                    id: 'product-1',
                    name: 'Test Product 1',
                    price: 10.99,
                    inventory: 100,
                    status: 'ACTIVE',
                },
                {
                    id: 'product-2',
                    name: 'Test Product 2',
                    price: 25.00,
                    inventory: 50,
                    status: 'ACTIVE',
                },
            ];

            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProducts as any);

            const request = new NextRequest('http://localhost/api/admin/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.products).toHaveLength(2);
            expect(result.products[0].name).toBe('Test Product 1');
            expect(mockDb.product.findMany).toHaveBeenCalled();
        }); it('should handle pagination correctly', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);

            const request = new NextRequest('http://localhost/api/admin/products?page=2&pageSize=10');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                skip: 10, // (page 2 - 1) * pageSize 10
                take: 10,
                orderBy: expect.any(Object),
                include: expect.any(Object),
                where: expect.any(Object),
            });
        });

        it('should handle search filtering', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            mockCache.get.mockResolvedValue(null);
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);

            const request = new NextRequest('http://localhost/api/admin/products?search=test%20product');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.product.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 20,
                orderBy: expect.any(Object),
                include: expect.any(Object),
                where: {
                    OR: [
                        { name: { contains: 'test product', mode: 'insensitive' } },
                        { description: { contains: 'test product', mode: 'insensitive' } },
                    ],
                },
            });
        });

        it('should deny access to non-admin users', async () => {
            mockGetServerSession.mockResolvedValue(mockUserSession as any);

            const request = new NextRequest('http://localhost/api/admin/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
            expect(mockDb.product.findMany).not.toHaveBeenCalled();
        });

        it('should deny access to unauthenticated users', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/admin/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
            expect(mockDb.product.findMany).not.toHaveBeenCalled();
        });

        it('should return cached data when available', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            const cachedData = { products: [], pagination: {}, totalProducts: 0 };
            mockCache.get.mockResolvedValue(cachedData);

            const request = new NextRequest('http://localhost/api/admin/products');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result).toEqual(cachedData);
            expect(mockDb.product.findMany).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/admin/products', () => {
        const validProductData = {
            name: 'New Test Product',
            description: 'A test product description',
            price: 19.99,
            compareAtPrice: 29.99,
            inventory: 100,
            images: ['https://example.com/image1.jpg'],
            categoryId: 'category-1',
            supplierId: 'supplier-1',
            tags: ['test', 'product'],
            features: ['feature1', 'feature2'],
            specifications: { color: 'blue', size: 'medium' },
        };

        it('should create a new product successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);

            // Mock category and supplier validation
            (mockDb.category.findUnique as jest.Mock).mockResolvedValue({ id: 'category-1' } as any);
            (mockDb.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'supplier-1' } as any);

            // Mock product creation
            const mockCreatedProduct = {
                id: 'new-product-1',
                ...validProductData,
                status: 'ACTIVE',
                createdAt: new Date(),
            };
            (mockDb.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct as any);

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(validProductData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.success).toBe(true);
            expect(result.product.id).toBe('new-product-1');
            expect(mockDb.product.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: validProductData.name,
                    price: validProductData.price,
                    inventory: validProductData.inventory,
                }),
            });
        });

        it('should validate required fields', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);

            const invalidData = {
                ...validProductData,
                name: '', // Empty name
                price: -10, // Negative price
            };

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(invalidData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toContain('validation');
            expect(mockDb.product.create).not.toHaveBeenCalled();
        });

        it('should validate category exists', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            (mockDb.category.findUnique as jest.Mock).mockResolvedValue(null); // Category not found

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(validProductData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toContain('Category not found');
            expect(mockDb.product.create).not.toHaveBeenCalled();
        });

        it('should validate supplier exists', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            (mockDb.category.findUnique as jest.Mock).mockResolvedValue({ id: 'category-1' } as any);
            (mockDb.supplier.findUnique as jest.Mock).mockResolvedValue(null); // Supplier not found

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(validProductData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toContain('Supplier not found');
            expect(mockDb.product.create).not.toHaveBeenCalled();
        });

        it('should deny access to non-admin users', async () => {
            mockGetServerSession.mockResolvedValue(mockUserSession as any);

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(validProductData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
            expect(mockDb.product.create).not.toHaveBeenCalled();
        });

        it('should handle database errors gracefully', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession as any);
            (mockDb.category.findUnique as jest.Mock).mockResolvedValue({ id: 'category-1' } as any);
            (mockDb.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'supplier-1' } as any);
            (mockDb.product.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost/api/admin/products', {
                method: 'POST',
                body: JSON.stringify(validProductData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.error).toBe('Failed to create product');
        });
    });
});
