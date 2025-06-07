import { Currency } from "@/contexts/currency-provider";

// Free shipping thresholds in USD (base currency)
export const FREE_SHIPPING_THRESHOLDS = {
    domestic: {
        standard: 50,
        express: null, // No free shipping for express
        overnight: null, // No free shipping for overnight
    },
    international: {
        canada: 75,
        europe: 100,
        asiaPacific: 150,
        restOfWorld: 200,
    }
} as const;

// Shipping costs in USD (base currency)
export const SHIPPING_COSTS = {
    domestic: {
        standard: 5,
        express: 12,
        overnight: 25,
    },
    international: {
        canada: 9.99,
        europe: 14.99,
        asiaPacific: 19.99,
        restOfWorld: 24.99,
    }
} as const;

// Convert USD threshold to target currency
export function convertThresholdToCurrency(
    thresholdUSD: number,
    targetCurrency: Currency,
    exchangeRates: Record<string, number>
): number {
    if (targetCurrency === "USD") return thresholdUSD;

    const rate = exchangeRates[targetCurrency];
    if (!rate) return thresholdUSD;

    const converted = thresholdUSD * rate;
    return targetCurrency === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;
}

// Convert USD shipping cost to target currency
export function convertShippingCostToCurrency(
    costUSD: number,
    targetCurrency: Currency,
    exchangeRates: Record<string, number>
): number {
    if (targetCurrency === "USD") return costUSD;

    const rate = exchangeRates[targetCurrency];
    if (!rate) return costUSD;

    const converted = costUSD * rate;
    return targetCurrency === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;
}

// Check if order qualifies for free shipping
export function qualifiesForFreeShipping(
    subtotalInTargetCurrency: number,
    shippingMethod: string,
    targetCurrency: Currency,
    exchangeRates: Record<string, number>,
    shippingRegion: 'domestic' | 'canada' | 'europe' | 'asiaPacific' | 'restOfWorld' = 'domestic'
): boolean {
    // Get the appropriate threshold
    let thresholdUSD: number | null = null;

    if (shippingRegion === 'domestic') {
        switch (shippingMethod) {
            case 'standard':
                thresholdUSD = FREE_SHIPPING_THRESHOLDS.domestic.standard;
                break;
            case 'express':
            case 'overnight':
                thresholdUSD = null; // No free shipping for express/overnight domestic
                break;
        }
    } else {
        // International shipping - free shipping available for all methods if threshold is met
        switch (shippingRegion) {
            case 'canada':
                thresholdUSD = FREE_SHIPPING_THRESHOLDS.international.canada;
                break;
            case 'europe':
                thresholdUSD = FREE_SHIPPING_THRESHOLDS.international.europe;
                break;
            case 'asiaPacific':
                thresholdUSD = FREE_SHIPPING_THRESHOLDS.international.asiaPacific;
                break;
            case 'restOfWorld':
                thresholdUSD = FREE_SHIPPING_THRESHOLDS.international.restOfWorld;
                break;
        }
    }

    if (thresholdUSD === null) return false;

    // Convert threshold to target currency
    const thresholdInTargetCurrency = convertThresholdToCurrency(
        thresholdUSD,
        targetCurrency,
        exchangeRates
    );

    return subtotalInTargetCurrency >= thresholdInTargetCurrency;
}

// Calculate shipping cost with free shipping logic
export function calculateShippingCost(
    subtotalInTargetCurrency: number,
    shippingMethod: string,
    targetCurrency: Currency,
    exchangeRates: Record<string, number>,
    shippingRegion: 'domestic' | 'canada' | 'europe' | 'asiaPacific' | 'restOfWorld' = 'domestic'
): number {
    // Check if order qualifies for free shipping
    if (qualifiesForFreeShipping(
        subtotalInTargetCurrency,
        shippingMethod,
        targetCurrency,
        exchangeRates,
        shippingRegion
    )) {
        return 0;
    }

    // Get base shipping cost in USD
    let costUSD: number;

    if (shippingRegion === 'domestic') {
        switch (shippingMethod) {
            case 'express':
                costUSD = SHIPPING_COSTS.domestic.express;
                break;
            case 'overnight':
                costUSD = SHIPPING_COSTS.domestic.overnight;
                break;
            default:
                costUSD = SHIPPING_COSTS.domestic.standard;
                break;
        }
    } else {
        switch (shippingRegion) {
            case 'canada':
                costUSD = SHIPPING_COSTS.international.canada;
                break;
            case 'europe':
                costUSD = SHIPPING_COSTS.international.europe;
                break;
            case 'asiaPacific':
                costUSD = SHIPPING_COSTS.international.asiaPacific;
                break;
            case 'restOfWorld':
                costUSD = SHIPPING_COSTS.international.restOfWorld;
                break;
            default:
                costUSD = SHIPPING_COSTS.domestic.standard;
                break;
        }
    }

    // Convert to target currency
    return convertShippingCostToCurrency(costUSD, targetCurrency, exchangeRates);
}

// Get the free shipping threshold message for display
export function getFreeShippingThresholdMessage(
    targetCurrency: Currency,
    exchangeRates: Record<string, number>,
    shippingRegion: 'domestic' | 'canada' | 'europe' | 'asiaPacific' | 'restOfWorld' = 'domestic'
): string {
    const thresholdUSD = shippingRegion === 'domestic'
        ? FREE_SHIPPING_THRESHOLDS.domestic.standard
        : FREE_SHIPPING_THRESHOLDS.international[shippingRegion];

    const thresholdInTargetCurrency = convertThresholdToCurrency(
        thresholdUSD,
        targetCurrency,
        exchangeRates
    );

    // Format the threshold with currency symbol
    const currencySymbols: { [key in Currency]: string } = {
        USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥"
    };

    const symbol = currencySymbols[targetCurrency] || "$";
    const formatted = targetCurrency === "JPY"
        ? `${symbol}${Math.round(thresholdInTargetCurrency).toLocaleString()}`
        : `${symbol}${thresholdInTargetCurrency.toFixed(2)}`;

    return `Free Shipping on orders over ${formatted}`;
}
