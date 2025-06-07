// Product API service tests
import { getProducts, getProductById } from './product-service';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        product: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

// Import after mocking
import { db } from '@/lib/db';

// Create properly typed mocks
const mockDb = db as jest.Mocked<typeof db>;

describe('Product API Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProducts', () => {
        const mockProductList = [
            {
                id: 'product-1',
                name: 'Test Product 1',
                description: 'Test description 1',
                price: 19.99,
                images: ['image1.jpg'],
                inventory: 10,
                isFeatured: true,
                category: { id: 'category-1', name: 'Test Category' },
                createdAt: new Date('2025-01-01'),
            },
            {
                id: 'product-2',
                name: 'Test Product 2',
                description: 'Test description 2',
                price: 29.99,
                images: ['image2.jpg'],
                inventory: 5,
                isFeatured: false,
                category: { id: 'category-1', name: 'Test Category' },
                createdAt: new Date('2025-01-02'),
            },
        ];

        it('should return products with default parameters', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProductList);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            const result = await getProducts();

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.products).toEqual(mockProductList);
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.pageSize).toBe(12);
            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 12,
                })
            );
        });

        it('should handle pagination parameters', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProductList);
            (mockDb.product.count as jest.Mock).mockResolvedValue(30);

            const result = await getProducts({
                page: 2,
                pageSize: 10,
            });

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.pageSize).toBe(10);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(true);
            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                })
            );
        });

        it('should apply category filter', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([mockProductList[0]]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(1);

            const result = await getProducts({
                categoryId: 'category-1',
            });

            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        categoryId: 'category-1',
                    }),
                })
            );
        });

        it('should apply search filter', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([mockProductList[0]]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(1);

            const result = await getProducts({
                search: 'test',
            });

            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: [
                            { name: { contains: 'test', mode: 'insensitive' } },
                            { description: { contains: 'test', mode: 'insensitive' } },
                        ],
                    }),
                })
            );
        });

        it('should apply price filters', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([mockProductList[0]]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(1);

            const result = await getProducts({
                minPrice: 10,
                maxPrice: 20,
            });

            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        price: {
                            gte: 10,
                            lte: 20,
                        },
                    }),
                })
            );
        });

        it('should apply featured filter', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue([mockProductList[0]]);
            (mockDb.product.count as jest.Mock).mockResolvedValue(1);

            const result = await getProducts({
                featured: true,
            });

            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isFeatured: true,
                    }),
                })
            );
        });

        it('should apply sorting', async () => {
            // Mock database responses
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProductList);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            // Test price_asc sorting
            await getProducts({ sort: 'price_asc' });
            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { price: 'asc' },
                })
            );

            // Reset mock to test another sort
            jest.clearAllMocks();
            (mockDb.product.findMany as jest.Mock).mockResolvedValue(mockProductList);
            (mockDb.product.count as jest.Mock).mockResolvedValue(2);

            // Test bestselling sorting
            await getProducts({ sort: 'bestselling' });
            expect(mockDb.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { salesCount: 'desc' },
                })
            );
        });

        it('should handle database errors', async () => {
            (mockDb.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            try {
                await getProducts();
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('getProductById', () => {
        const mockProduct = {
            id: 'product-1',
            name: 'Test Product',
            description: 'Test description',
            price: 19.99,
            images: ['image1.jpg'],
            inventory: 10,
            isFeatured: true,
            category: { id: 'category-1', name: 'Test Category' },
            variants: [],
            reviews: [
                {
                    id: 'review-1',
                    rating: 4,
                    comment: 'Great product',
                    createdAt: new Date(),
                    user: {
                        id: 'user-1',
                        name: 'Test User',
                    },
                },
                {
                    id: 'review-2',
                    rating: 5,
                    comment: 'Excellent!',
                    createdAt: new Date(),
                    user: {
                        id: 'user-2',
                        name: 'Another User',
                    },
                },
            ],
        };

        it('should return product details with average rating', async () => {
            // Mock database responses
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

            const result = await getProductById('product-1');

            expect(result.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.product).toEqual({
                ...mockProduct,
                averageRating: 4.5, // (4 + 5) / 2
            });
        });

        it('should return 404 if product not found', async () => {
            // Mock database responses
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await getProductById('non-existent-id');

            expect(result.status).toBe(404);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Product not found');
        });

        it('should handle product with no reviews', async () => {
            // Mock database responses
            const productWithNoReviews = {
                ...mockProduct,
                reviews: [],
            };
            (mockDb.product.findUnique as jest.Mock).mockResolvedValue(productWithNoReviews);

            const result = await getProductById('product-1');

            expect(result.product.averageRating).toBeNull();
        });

        it('should handle database errors', async () => {
            (mockDb.product.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

            try {
                await getProductById('product-1');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });
});
