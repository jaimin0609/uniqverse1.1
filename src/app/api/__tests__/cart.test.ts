// Cart API endpoint tests
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../cart/route';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        cartItem: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            findUnique: jest.fn(),
        },
        product: {
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

// Import after mocking
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';

const mockDb = {
    cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    cartItem: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
    },
    product: {
        findUnique: jest.fn(),
    },
} as any;

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
} as any;

describe('/api/cart', () => {
    const mockSession = {
        user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'USER',
        },
    };

    const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        updatedAt: new Date(),
        CartItem: [],
    }; beforeEach(() => {
        jest.clearAllMocks();
        // Set up db mock to return our mock functions
        (db as any).cart = mockDb.cart;
        (db as any).cartItem = mockDb.cartItem;
        (db as any).product = mockDb.product;
        (cache as any).get = mockCache.get;
        (cache as any).set = mockCache.set;
        (cache as any).del = mockCache.del;
    });

    describe('GET /api/cart', () => {
        it('should retrieve existing cart for authenticated user', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null); // No cache
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);

            const request = new NextRequest('http://localhost/api/cart');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.id).toBe('cart-1');
            expect(mockDb.cart.findUnique).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: expect.any(Object),
            });
        });

        it('should create new cart if none exists', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(null);
            mockDb.cart.findUnique.mockResolvedValue(null);
            mockDb.cart.create.mockResolvedValue(mockCart as any);

            const request = new NextRequest('http://localhost/api/cart');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.cart.create).toHaveBeenCalledWith({
                data: {
                    id: 'mock-uuid',
                    userId: 'user-1',
                    updatedAt: expect.any(Date),
                },
                include: expect.any(Object),
            });
        });

        it('should handle guest cart with cartId parameter', async () => {
            mockGetServerSession.mockResolvedValue(null);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);

            const request = new NextRequest('http://localhost/api/cart?cartId=guest-cart-1');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockDb.cart.findUnique).toHaveBeenCalledWith({
                where: { id: 'guest-cart-1' },
                include: expect.any(Object),
            });
        });

        it('should return cached cart when available', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockCache.get.mockResolvedValue(mockCart);

            const request = new NextRequest('http://localhost/api/cart');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.id).toBe('cart-1');
            expect(mockDb.cart.findUnique).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/cart', () => {
        const cartData = {
            items: [
                {
                    productId: 'product-1',
                    quantity: 2,
                },
            ],
        };

        it('should add items to cart successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);
            mockDb.product.findUnique.mockResolvedValue({
                id: 'product-1',
                name: 'Test Product',
                price: 10.99,
                inventory: 100,
            } as any);
            mockDb.cartItem.findUnique.mockResolvedValue(null);
            mockDb.cartItem.create.mockResolvedValue({} as any);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify(cartData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.create).toHaveBeenCalled();
        });

        it('should update existing cart item quantity', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);
            mockDb.product.findUnique.mockResolvedValue({
                id: 'product-1',
                inventory: 100,
            } as any);
            mockDb.cartItem.findUnique.mockResolvedValue({
                id: 'cart-item-1',
                quantity: 1,
            } as any);
            mockDb.cartItem.update.mockResolvedValue({} as any);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify(cartData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'cart-item-1' },
                data: { quantity: 3 }, // 1 + 2
            });
        });

        it('should validate product existence', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);
            mockDb.product.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify(cartData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toContain('Product not found');
        });

        it('should validate inventory availability', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);
            mockDb.product.findUnique.mockResolvedValue({
                id: 'product-1',
                inventory: 1, // Less than requested quantity
            } as any);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify(cartData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toContain('insufficient inventory');
        });

        it('should require authentication', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify(cartData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Authentication required');
        });
    });

    describe('DELETE /api/cart', () => {
        it('should clear cart successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockDb.cart.findUnique.mockResolvedValue(mockCart as any);
            mockDb.cartItem.deleteMany.mockResolvedValue({ count: 2 } as any);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'DELETE',
            });

            const response = await DELETE(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(mockDb.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { cartId: 'cart-1' },
            });
        });

        it('should require authentication', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'DELETE',
            });

            const response = await DELETE(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Authentication required');
        });
    });
});
