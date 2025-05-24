import { describe, it, expect } from '@jest/globals';

// Minimal mock of the convertPrice function from currency-provider
function convertPrice(priceInUSD: number, currency: string, exchangeRates: Record<string, number>): number {
    if (!exchangeRates[currency]) return priceInUSD;
    const convertedPrice = priceInUSD * exchangeRates[currency];
    return currency === "JPY"
        ? Math.round(convertedPrice)
        : Math.round(convertedPrice * 100) / 100;
}

describe('convertPrice', () => {
    const rates = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.51,
        CAD: 1.36,
        JPY: 154.35,
    };

    it('returns the same value for USD', () => {
        expect(convertPrice(100, 'USD', rates)).toBe(100);
    });

    it('converts USD to EUR', () => {
        expect(convertPrice(100, 'EUR', rates)).toBe(92);
    });

    it('converts USD to GBP', () => {
        expect(convertPrice(100, 'GBP', rates)).toBe(79);
    });

    it('converts USD to AUD', () => {
        expect(convertPrice(100, 'AUD', rates)).toBe(151);
    });

    it('converts USD to CAD', () => {
        expect(convertPrice(100, 'CAD', rates)).toBe(136);
    });

    it('converts USD to JPY and rounds to integer', () => {
        expect(convertPrice(100, 'JPY', rates)).toBe(15435);
    });

    it('returns original price if currency not in rates', () => {
        expect(convertPrice(100, 'CHF', rates)).toBe(100);
    });
});
