/**
 * Helper utilities for testing Next.js API routes
 */

// Mock NextRequest class
export class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    bodyData: any;
    nextUrl: URL;

    constructor(url: string, options: any = {}) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.method = options.method || 'GET';
        this.headers = new Headers(options.headers || {});
        this.bodyData = options.body;
    }

    json() {
        return Promise.resolve(this.bodyData);
    }

    text() {
        return Promise.resolve(JSON.stringify(this.bodyData));
    }

    formData() {
        return Promise.resolve(new FormData());
    }
}

// Mock NextResponse class
export class MockNextResponse {
    static json(data: any, init: any = {}) {
        return {
            status: init?.status || 200,
            data,
            headers: init?.headers || {},
            json: () => data,
        };
    }

    static redirect(url: string, status: number = 302) {
        return {
            status,
            headers: { Location: url },
            redirect: true,
        };
    }

    static error() {
        return {
            status: 500,
            data: { error: 'Internal Server Error' },
        };
    }
}

// Create test request helper
export function createTestRequest(
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
) {
    return new MockNextRequest(url, {
        method,
        body,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}

// Helper for testing response objects
export function validateResponse(
    response: any,
    expectedStatus: number,
    expectedData?: any
) {
    expect(response.status).toBe(expectedStatus);

    if (expectedData) {
        expect(response.data).toEqual(expectedData);
    }

    return response;
}

// Create a mock session
export function createMockSession(user = {}) {
    return {
        user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            ...user,
        },
    };
}

// Create a mock admin session
export function createMockAdminSession() {
    return createMockSession({
        id: 'admin-user-id',
        role: 'ADMIN',
    });
}
