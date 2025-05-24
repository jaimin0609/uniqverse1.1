"use client";

import { useCurrency } from "@/contexts/currency-provider";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

/**
 * A component to test and debug the currency system.
 * Place this on any page where you're experiencing issues.
 */
export function CurrencyTest() {
    const {
        currency,
        setCurrency,
        exchangeRates,
        availableCurrencies,
        convertPrice,
        formatPrice,
        isLoading
    } = useCurrency();

    // Test prices
    const testAmount = 99.99;
    const convertedAmount = convertPrice(testAmount);
    const formattedAmount = formatPrice(convertedAmount);

    // On mount, check localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCurrency = localStorage.getItem('uniqverse-currency');
            console.log("Current saved currency in localStorage:", savedCurrency);
        }
    }, []);
    // Force change to each currency
    const testAllCurrencies = () => {
        if (availableCurrencies.length === 0) {
            console.error("No available currencies to test!");
            return;
        }

        console.log("Testing all currencies...");
        // Track current index
        const currentIndex = availableCurrencies.indexOf(currency);
        const nextIndex = (currentIndex + 1) % availableCurrencies.length;
        const nextCurrency = availableCurrencies[nextIndex];

        console.log(`Changing currency from ${currency} to ${nextCurrency}`);
        setCurrency(nextCurrency);

        // After changing currency, check if localStorage was updated correctly
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                const savedCurrency = localStorage.getItem('uniqverse-currency');
                console.log("Updated localStorage currency:", savedCurrency);
                console.log(`Does it match? ${savedCurrency === nextCurrency ? 'YES ✓' : 'NO ✗'}`);
            }
        }, 100);
    };

    return (
        <div className="border rounded-md p-4 my-4 bg-slate-50 dark:bg-slate-800">
            <h2 className="text-lg font-bold mb-4">Currency System Test</h2>

            <div className="grid gap-2">
                <div>
                    <span className="font-medium">Current Currency:</span> {currency}
                </div>
                <div>
                    <span className="font-medium">Loading State:</span> {isLoading ? "Loading..." : "Ready"}
                </div>
                <div>
                    <span className="font-medium">Available Currencies:</span> {availableCurrencies.join(", ")}
                </div>        <div>
                    <span className="font-medium">Test Price ($99.99 USD):</span> {formattedAmount}
                </div>

                {/* Test price formatting for all currencies */}
                <div>
                    <span className="font-medium">Formatted in all currencies:</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableCurrencies.map(currCode => {
                            // Calculate what this price would be in each currency
                            const rate = exchangeRates[currCode] || 1;
                            const price = testAmount * rate;

                            // Format based on currency
                            let formatted = '';
                            const symbol = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥' }[currCode] || '$';

                            if (currCode === 'JPY') {
                                formatted = `${symbol}${Math.round(price).toLocaleString()}`;
                            } else {
                                formatted = `${symbol}${price.toFixed(2)}`;
                            }

                            return (
                                <div key={currCode} className={`p-2 rounded ${currency === currCode ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                                    <span className="font-medium">{currCode}:</span> {formatted}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <span className="font-medium">Exchange Rates:</span>
                    <pre className="text-xs mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-auto max-h-24">
                        {JSON.stringify(exchangeRates, null, 2)}
                    </pre>
                </div>

                <div className="mt-4">
                    <Button onClick={testAllCurrencies} disabled={isLoading || availableCurrencies.length === 0}>
                        Test Next Currency
                    </Button>
                </div>
            </div>
        </div>
    );
}
