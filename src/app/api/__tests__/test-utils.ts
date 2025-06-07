// Test utilities and helpers for API testing
import { NextRequest, NextResponse } from 'next/server';

export const createMockDb = () => {
    const mockFunctions = {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
    };

    return {
        user: { ...mockFunctions },
        product: { ...mockFunctions },
        cart: { ...mockFunctions },
        cartItem: { ...mockFunctions },
        order: { ...mockFunctions },
        orderItem: { ...mockFunctions },
        category: { ...mockFunctions },
        supplier: { ...mockFunctions },
        coupon: { ...mockFunctions },
        promotion: { ...mockFunctions },
        productVariant: { ...mockFunctions },
        resetMocks: () => {
            Object.values(mockFunctions).forEach(fn => fn.mockReset());
        }
    };
};

// Helper to setup mock database with typed responses
export const setupMockDb = (mockDb: any) => {
    return {
        setupFindUnique: (model: string, response: any) => {
            (mockDb[model].findUnique as jest.Mock).mockResolvedValue(response);
        },
        setupFindMany: (model: string, response: any[]) => {
            (mockDb[model].findMany as jest.Mock).mockResolvedValue(response);
        },
        setupCreate: (model: string, response: any) => {
            (mockDb[model].create as jest.Mock).mockResolvedValue(response);
        },
        setupUpdate: (model: string, response: any) => {
            (mockDb[model].update as jest.Mock).mockResolvedValue(response);
        },
        setupCount: (model: string, response: number) => {
            (mockDb[model].count as jest.Mock).mockResolvedValue(response);
        },
        setupError: (model: string, method: string, error: Error) => {
            (mockDb[model][method] as jest.Mock).mockRejectedValue(error);
        }
    };
};

export const createMockSession = (role: 'USER' | 'ADMIN' = 'USER', userId: string = 'test-user-id') => ({
    user: {
        id: userId,
        email: 'test@example.com',
        role,
        name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

export const createMockRequest = (
    url: string = 'http://localhost/api/test',
    options: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
        searchParams?: Record<string, string>;
    } = {}
) => {
    const { method = 'GET', body, headers = {}, searchParams = {} } = options;

    // Add search params to URL
    const urlWithParams = new URL(url);
    Object.entries(searchParams).forEach(([key, value]) => {
        urlWithParams.searchParams.set(key, value);
    }); const requestInit: any = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && method !== 'GET') {
        requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return new NextRequest(urlWithParams.toString(), requestInit);
};

export const expectJsonResponse = async (
    response: Response,
    expectedStatus: number = 200,
    expectedData?: any
) => {
    expect(response.status).toBe(expectedStatus);

    const json = await response.json();

    if (expectedData) {
        expect(json).toEqual(expect.objectContaining(expectedData));
    }

    return json;
};

export const expectErrorResponse = async (
    response: Response,
    expectedStatus: number,
    expectedError?: string
) => {
    expect(response.status).toBe(expectedStatus);

    const json = await response.json();
    expect(json).toHaveProperty('error');

    if (expectedError) {
        expect(json.error).toContain(expectedError);
    }

    return json;
};

// Common test data factories
export const createTestUser = (overrides: any = {}) => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createTestProduct = (overrides: any = {}) => ({
    id: 'product-1',
    name: 'Test Product',
    description: 'A test product',
    price: 19.99,
    compareAtPrice: 29.99,
    inventory: 100,
    status: 'ACTIVE',
    images: ['https://example.com/image.jpg'],
    categoryId: 'category-1',
    supplierId: 'supplier-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createTestCart = (overrides: any = {}) => ({
    id: 'cart-1',
    userId: 'user-1',
    updatedAt: new Date(),
    CartItem: [],
    ...overrides,
});

export const createTestOrder = (overrides: any = {}) => ({
    id: 'order-1',
    orderNumber: 'ORD-001',
    userId: 'user-1',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    subtotal: 19.99,
    shipping: 5.00,
    tax: 2.00,
    total: 26.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

// Authentication helpers
export const mockAuthentication = (getServerSession: jest.Mock, session: any = null) => {
    getServerSession.mockResolvedValue(session);
};

export const mockAdminAuthentication = (getServerSession: jest.Mock, userId: string = 'admin-1') => {
    mockAuthentication(getServerSession, createMockSession('ADMIN', userId));
};

export const mockUserAuthentication = (getServerSession: jest.Mock, userId: string = 'user-1') => {
    mockAuthentication(getServerSession, createMockSession('USER', userId));
};

export const mockNoAuthentication = (getServerSession: jest.Mock) => {
    mockAuthentication(getServerSession, null);
};
