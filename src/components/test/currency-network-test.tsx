"use client";

import { useCurrency } from "@/contexts/currency-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * A component to simulate network issues and verify fallback behavior
 */
export function CurrencyNetworkTest() {
    const {
        currency,
        setCurrency,
        exchangeRates,
        isFallback,
        isLoading
    } = useCurrency();

    const [message, setMessage] = useState("");

    // Force a network error by using an invalid API endpoint
    const testFallback = async () => {
        setMessage("Testing fallback rates...");

        try {
            // Make a request to a non-existent endpoint to force a network error
            const response = await fetch('/api/invalid-endpoint-for-testing');
            setMessage(`Fallback test response status: ${response.status}`);
        } catch (error) {
            if (error instanceof Error) {
                setMessage(`Fallback test error: ${error.message}`);
            } else {
                setMessage(`Fallback test error: ${String(error)}`);
            }
        }

        // Check if we're using fallback rates now
        setTimeout(() => {
            setMessage(`Current fallback status: ${isFallback ? 'Using fallback rates' : 'Using real rates'}`);
        }, 1000);
    };

    return (
        <div className="border rounded-md p-4 my-4 bg-slate-50 dark:bg-slate-800">
            <h2 className="text-lg font-bold mb-4">Currency Network Test</h2>

            <div className="grid gap-2">
                <div>
                    <span className="font-medium">Current Currency:</span> {currency}
                </div>
                <div>
                    <span className="font-medium">Using Fallback Rates:</span> {isFallback ? "Yes" : "No"}
                </div>
                <div>
                    <span className="font-medium">Loading State:</span> {isLoading ? "Loading..." : "Ready"}
                </div>

                <div className="mt-4">
                    <Button onClick={testFallback} disabled={isLoading}>
                        Test Fallback Behavior
                    </Button>

                    {message && (
                        <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
