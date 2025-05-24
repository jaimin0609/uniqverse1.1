"use client";

import React, { useEffect } from 'react';
import { useCurrency } from "@/contexts/currency-provider";
import { Button } from "@/components/ui/button";

export function CurrencyDebug() {
    const {
        currency,
        setCurrency,
        availableCurrencies,
        isLoading,
        exchangeRates
    } = useCurrency();

    // Log localStorage on mount
    useEffect(() => {
        try {
            const storedCurrency = localStorage.getItem('uniqverse-currency');
            console.log('Current localStorage currency:', storedCurrency);

            // Check if localStorage is working
            localStorage.setItem('test-storage', 'works');
            const testResult = localStorage.getItem('test-storage');
            console.log('localStorage test:', testResult === 'works' ? 'working' : 'not working');

            // Try to check all localStorage keys
            console.log('All localStorage keys:');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    console.log(`- ${key}: ${localStorage.getItem(key)}`);
                }
            }
        } catch (error) {
            console.error('Error accessing localStorage:', error);
        }
    }, []);

    // Force reset to USD
    const resetToUSD = () => {
        try {
            console.log('Attempting to reset currency to USD');
            localStorage.removeItem('uniqverse-currency');
            setCurrency('USD');
            console.log('Reset currency complete');
        } catch (error) {
            console.error('Error resetting currency:', error);
        }
    };

    // Try clicking each currency directly
    const forceCurrency = (curr: string) => {
        try {
            console.log(`Direct setting currency to ${curr}`);
            setCurrency(curr as any);
            localStorage.setItem('uniqverse-currency', curr);
            console.log(`Directly set currency to ${curr}, checking localStorage:`, localStorage.getItem('uniqverse-currency'));
        } catch (error) {
            console.error(`Error setting ${curr}:`, error);
        }
    };

    return (
        <div className="border rounded-md p-4 my-4 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-lg font-bold mb-4">Currency Debug Panel</h2>

            <div className="space-y-2 mb-4">
                <div><span className="font-medium">Current Currency:</span> {currency}</div>
                <div><span className="font-medium">isLoading:</span> {isLoading ? 'true' : 'false'}</div>
                <div><span className="font-medium">Available Currencies:</span> {availableCurrencies.join(', ')}</div>
                <div><span className="font-medium">Exchange Rates Count:</span> {Object.keys(exchangeRates).length}</div>
            </div>

            <div className="grid gap-2">
                <Button
                    onClick={resetToUSD}
                    variant="outline"
                    className="bg-white dark:bg-slate-800"
                >
                    Reset to USD + Clear localStorage
                </Button>

                <div className="grid grid-cols-3 gap-2 mt-2">
                    {["USD", "EUR", "GBP", "AUD", "CAD", "JPY"].map(curr => (
                        <Button
                            key={curr}
                            onClick={() => forceCurrency(curr)}
                            variant="outline"
                            className={`${currency === curr ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-slate-800'
                                }`}
                        >
                            Force {curr}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
