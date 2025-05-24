// Optional: configure or set up a testing library before each test
// For example, you can import jest-dom matchers
import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock matchMedia
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();
