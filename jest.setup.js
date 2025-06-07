// Set up testing environment
require('@testing-library/jest-dom');

// Mock fetch for all tests
global.fetch = jest.fn();

// Mock Next.js Request and Response for API tests
global.Request = jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
}));

global.Response = jest.fn().mockImplementation((body, options) => ({
    status: options?.status || 200,
    statusText: options?.statusText || 'OK',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
}));

// Mock ResizeObserver for component tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock matchMedia for component tests
global.matchMedia = global.matchMedia || function () {
    return {
        matches: false,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    };
};

// Mock scrollIntoView for component tests
if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = jest.fn();
}