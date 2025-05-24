import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClientPrice } from '../client-price';
import { useCurrency } from '../../../contexts/currency-provider'; // Corrected path

// Mock the useCurrency hook
jest.mock('../../../contexts/currency-provider', () => ({ // Corrected path
    useCurrency: jest.fn(),
}));

describe('ClientPrice', () => {
    const mockUseCurrency = useCurrency as jest.Mock;

    beforeEach(() => {
        // Reset the mock before each test
        mockUseCurrency.mockReturnValue({
            convertPrice: (amount: number) => amount, // Simple pass-through for testing
            formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
            currency: 'USD',
            isLoading: false,
        });
    });

    test('renders FormattedPrice with the correct amount', () => {
        render(<ClientPrice amount={123.45} />);
        // Check if FormattedPrice renders the formatted amount
        expect(screen.getByText('$123.45')).toBeInTheDocument();
    });

    test('renders loading state when useCurrency is loading', () => {
        mockUseCurrency.mockReturnValueOnce({
            convertPrice: (amount: number) => amount,
            formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
            currency: 'USD',
            isLoading: true,
        });
        render(<ClientPrice amount={100} />);
        expect(screen.getByText('...')).toBeInTheDocument(); // As per FormattedPrice loading state
    });

    test('passes amount to FormattedPrice correctly', () => {
        const amount = 99.99;
        render(<ClientPrice amount={amount} />);
        // This implicitly tests that FormattedPrice received the correct amount
        // by checking the output of its formatPrice function.
        expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
});
