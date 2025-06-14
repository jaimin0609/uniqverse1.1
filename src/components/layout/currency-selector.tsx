import React, { useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { useCurrency, Currency } from "@/contexts/currency-provider";

// Define currency details (value and label) locally for display purposes
// This can be kept separate from the availableCurrencies list from the context,
// which dictates what *can* be selected.
const currencyDetailsList = [
    { value: "USD" as Currency, label: "US Dollar (USD)" },
    { value: "EUR" as Currency, label: "Euro (EUR)" },
    { value: "GBP" as Currency, label: "British Pound (GBP)" },
    { value: "AUD" as Currency, label: "Australian Dollar (AUD)" },
    { value: "CAD" as Currency, label: "Canadian Dollar (CAD)" },
    { value: "JPY" as Currency, label: "Japanese Yen (JPY)" },
];

export function CurrencySelector() {
    // Destructure all needed values from the currency context
    const { currency, setCurrency, isLoading, availableCurrencies, exchangeRates, lastUpdated, isFallback } = useCurrency();
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const debugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debugTimeoutRef.current) {
                clearTimeout(debugTimeoutRef.current);
            }
        };
    }, []);

    // Filter currencies based on search term
    const filteredCurrencies = availableCurrencies.filter(code => {
        const details = currencyDetailsList.find(d => d.value === code);
        return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details?.label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Console log to debug when dropdown state changes
    React.useEffect(() => {
        console.log(`Currency selector dropdown state: ${open ? 'open' : 'closed'}`);
    }, [open]);

    // Improved currency selection handler with toast notification
    const handleCurrencyClick = (newCurrency: Currency) => {
        console.log(`Setting currency to: ${newCurrency}`);
        setCurrency(newCurrency);
        setOpen(false);

        // Get the rate for the selected currency
        const rate = exchangeRates[newCurrency];
        const formattedRate = rate ? rate.toFixed(2) : 'N/A';

        // Example price converted (show what $1 USD would be in the new currency)
        const examplePrice = 1;
        const convertedExamplePrice = examplePrice * (rate || 1);

        // Format according to the currency
        const symbol = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥' }[newCurrency] || '$';
        const formatted = newCurrency === 'JPY'
            ? `${symbol}${Math.round(convertedExamplePrice).toLocaleString()}`
            : `${symbol}${convertedExamplePrice.toFixed(2)}`;

        // Use toast notification instead of alert
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
                title: `Currency Changed to ${newCurrency}`,
                description: `Exchange rate: $1 USD = ${formatted}`,
                variant: 'success'
            }
        }));        // Debug logging for localStorage
        if (debugTimeoutRef.current) {
            clearTimeout(debugTimeoutRef.current);
        }
        debugTimeoutRef.current = setTimeout(() => {
            const saved = localStorage.getItem('uniqverse-currency');
            console.log(`After setCurrency(), localStorage shows: ${saved}`);
        }, 100);
    };

    // Debug - log available currencies
    React.useEffect(() => {
        console.log("CurrencySelector mounted/updated");
        console.log("Current currency:", currency);
        console.log("Available currencies:", availableCurrencies);
        console.log("Is loading:", isLoading);
    }, [currency, availableCurrencies, isLoading]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative">
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="relative min-w-[110px] h-8 px-2 flex justify-between items-center group"
                        // Never disable the button - let users click it even while loading
                        disabled={false}
                        onClick={() => setOpen(!open)} // Explicitly handle click to toggle
                    >
                        <Globe className="mr-1 h-4 w-4" />
                        {/* Display the current currency code directly */}
                        <span className="text-sm">{currency}</span>
                        {isLoading ? (
                            <span className="ml-1 h-4 w-4 animate-spin">⟳</span>
                        ) : (
                            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                        )}
                    </Button>
                </PopoverTrigger>

                {/* Tooltip shown on hover - positioned outside PopoverTrigger to prevent interference */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-slate-900 text-xs rounded shadow-lg border border-slate-200 dark:border-slate-700 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] hidden group-hover:block">
                    <div className="space-y-1">
                        <p>Current rate: 1 USD = {exchangeRates[currency]?.toFixed(2) || '1.00'} {currency}</p>
                        {lastUpdated && <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>}
                        {isFallback && <p className="text-amber-500">Using fallback rates</p>}
                    </div>
                </div>
            </div>            <PopoverContent className="w-[200px] p-0 z-[100]" sideOffset={4} align="end">
                {/* Simplified dropdown without Command component */}
                <div className="py-1 bg-white dark:bg-slate-950 rounded-md shadow-lg border border-slate-200 dark:border-slate-800">
                    <div className="p-2">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search currency..."
                            className="w-full px-2 py-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {/* Map over filtered currencies */}
                        {filteredCurrencies.map((currencyCode) => {
                            const details = currencyDetailsList.find(d => d.value === currencyCode);
                            return (
                                <div key={currencyCode} className="px-1">
                                    <button
                                        onClick={() => handleCurrencyClick(currencyCode as Currency)}
                                        className={`w-full text-left py-2 px-2 rounded flex items-center ${currency === currencyCode ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                currency === currencyCode ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {details?.label || currencyCode}
                                    </button>
                                </div>
                            );
                        })}
                        {filteredCurrencies.length === 0 && (
                            <div className="text-center py-2 text-slate-500">No currency found.</div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}