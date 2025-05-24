"use client";

import { CurrencyTest } from "@/components/test/currency-test";
import { CurrencyNetworkTest } from "@/components/test/currency-network-test";
import { CurrencyDebug } from "@/components/test/currency-debug";
import { Button } from "@/components/ui/button";

export default function TestPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Currency System Test Page</h1>
            <p className="mb-4">
                This page is used to test if the currency selection system is working properly.
                Use the components below to test currency changes and verify that prices update correctly.
            </p>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Instructions</h2>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Verify that the currency selector shows the current currency</li>
                    <li>Click the "Test Next Currency" button to cycle through currencies</li>
                    <li>Verify that the prices update with each currency change</li>
                    <li>Check the browser console to see if localStorage is updated correctly</li>
                    <li>Try refreshing the page and check if your currency selection is preserved</li>
                </ol>
            </div>

            <div className="mb-6">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                    Return to Homepage
                </Button>
            </div>            <CurrencyDebug />
            <CurrencyTest />
            <CurrencyNetworkTest />
        </div>
    );
}
