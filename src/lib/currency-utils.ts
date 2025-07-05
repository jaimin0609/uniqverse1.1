// Server-side currency conversion utilities
// This provides currency conversion functions for use in API routes and server components

export type Currency = "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY";

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    AUD: 1.51,
    CAD: 1.36,
    JPY: 154.35
};

// Cache for exchange rates
let cachedRates: Record<Currency, number> | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from the API
 */
async function fetchExchangeRates(): Promise<Record<Currency, number>> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/currency/exchange-rates`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.rates) {
            return data.rates as Record<Currency, number>;
        }

        throw new Error('Invalid API response');
    } catch (error) {
        console.warn('Failed to fetch exchange rates, using fallback:', error);
        return FALLBACK_RATES;
    }
}

/**
 * Get current exchange rates (with caching)
 */
async function getExchangeRates(): Promise<Record<Currency, number>> {
    const now = Date.now();

    // Return cached rates if they're still fresh
    if (cachedRates && (now - lastFetched) < CACHE_DURATION) {
        return cachedRates;
    }

    // Fetch fresh rates
    try {
        cachedRates = await fetchExchangeRates();
        lastFetched = now;
        return cachedRates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return cached rates if available, otherwise fallback
        return cachedRates || FALLBACK_RATES;
    }
}

/**
 * Convert a price from USD to the specified currency
 */
export async function convertPrice(priceInUSD: number, targetCurrency: Currency = 'USD'): Promise<number> {
    if (targetCurrency === 'USD') {
        return priceInUSD;
    }

    const rates = await getExchangeRates();
    const rate = rates[targetCurrency];

    if (!rate) {
        console.warn(`No exchange rate found for ${targetCurrency}, returning USD price`);
        return priceInUSD;
    }

    return priceInUSD * rate;
}

/**
 * Convert multiple prices from USD to the specified currency
 */
export async function convertPrices(pricesInUSD: number[], targetCurrency: Currency = 'USD'): Promise<number[]> {
    if (targetCurrency === 'USD') {
        return pricesInUSD;
    }

    const rates = await getExchangeRates();
    const rate = rates[targetCurrency];

    if (!rate) {
        console.warn(`No exchange rate found for ${targetCurrency}, returning USD prices`);
        return pricesInUSD;
    }

    return pricesInUSD.map(price => price * rate);
}

/**
 * Format a price for display
 */
export function formatPrice(price: number, currency: Currency = 'USD'): string {
    const symbols: Record<Currency, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        AUD: 'A$',
        CAD: 'C$',
        JPY: '¥'
    };

    const symbol = symbols[currency] || '$';

    // Format based on currency
    if (currency === 'JPY') {
        // Japanese Yen doesn't use decimal places
        return `${symbol}${Math.round(price).toLocaleString()}`;
    }

    return `${symbol}${price.toFixed(2)}`;
}

/**
 * Convert and format a price in one function
 */
export async function convertAndFormatPrice(priceInUSD: number, targetCurrency: Currency = 'USD'): Promise<string> {
    const convertedPrice = await convertPrice(priceInUSD, targetCurrency);
    return formatPrice(convertedPrice, targetCurrency);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        AUD: 'A$',
        CAD: 'C$',
        JPY: '¥'
    };

    return symbols[currency] || '$';
}

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): currency is Currency {
    return ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'].includes(currency);
}
