"use client";

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';

// Define supported currencies
export type Currency = "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY";

// Exchange rate interface
interface ExchangeRates {
    [key: string]: number;
}

interface CurrencyProviderProps {
    children: React.ReactNode;
    defaultCurrency?: Currency;
    storageKey?: string;
}

interface CurrencyProviderState {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRates: ExchangeRates;
    isLoading: boolean;
    isFallback: boolean;
    lastUpdated: string | null;
    convertPrice: (priceInUSD: number) => number;
    formatPrice: (price: number) => string;
    availableCurrencies: Currency[];
}

const initialState: CurrencyProviderState = {
    currency: "USD",
    setCurrency: () => null,
    exchangeRates: {},
    isLoading: true,
    isFallback: false,
    lastUpdated: null,
    convertPrice: (price) => price,
    formatPrice: (price) => `$${price.toFixed(2)}`,
    availableCurrencies: ["USD", "EUR", "GBP", "AUD", "CAD", "JPY"],
};

const CurrencyProviderContext = createContext<CurrencyProviderState>(initialState);

export function CurrencyProvider({
    children,
    defaultCurrency = "USD",
    storageKey = "uniqverse-currency",
}: CurrencyProviderProps) {
    const [currency, setCurrency] = useState<Currency>(defaultCurrency);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    // Make availableCurrencies a state variable
    const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(initialState.availableCurrencies);

    // First, try to load saved currency from localStorage on initial mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedCurrency = localStorage.getItem(storageKey) as Currency | null;
                // Check against the initial/static list for validity of saved currency
                if (savedCurrency && initialState.availableCurrencies.includes(savedCurrency)) {
                    setCurrency(savedCurrency);
                }
            } catch (error) {
                console.error("Error accessing localStorage:", error);
            }
        }
    }, [storageKey]);

    // Client-side fallback function
    const applyClientFallbackRates = useCallback(() => {
        const fallbackRatesData = {
            USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.51, CAD: 1.36, JPY: 154.35
        };
        setExchangeRates(fallbackRatesData);
        setAvailableCurrencies(Object.keys(fallbackRatesData) as Currency[]);
        setIsFallback(true);
        setLastUpdated(new Date().toISOString());
    }, []); // No dependencies as it uses static data and setters

    // Fetch exchange rates from API
    useEffect(() => {
        const fetchExchangeRatesInternal = async () => {
            try {
                setIsLoading(true);
                console.log("Fetching exchange rates...");
                const timestamp = new Date().getTime();
                const response = await fetch(`/api/currency/exchange-rates?_t=${timestamp}`);

                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Exchange rates response:", data);

                if (data.success) {
                    setExchangeRates(data.rates);
                    setLastUpdated(data.date || new Date().toISOString());
                    // Use isFallback from API response if available, otherwise assume not fallback
                    setIsFallback(!!data.isFallback);
                    // Update available currencies from the keys of the fetched rates
                    if (data.rates && Object.keys(data.rates).length > 0) {
                        const currencies = Object.keys(data.rates) as Currency[];
                        console.log("Available currencies:", currencies);
                        setAvailableCurrencies(currencies);
                    } else {
                        // If rates are empty/invalid but success is true, use client fallback
                        console.warn("API reported success but rates were empty/invalid. Applying client fallback.");
                        applyClientFallbackRates();
                    }
                } else {
                    console.error("API call indicated failure:", data.error || "Unknown API error condition");
                    applyClientFallbackRates();
                }
            } catch (error) {
                console.error("Error fetching exchange rates:", error);
                applyClientFallbackRates();
            } finally {
                console.log("Exchange rates fetching complete, setting loading to false");
                setIsLoading(false);
            }
        };

        fetchExchangeRatesInternal();
        const intervalId = setInterval(fetchExchangeRatesInternal, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [applyClientFallbackRates]); // Added applyClientFallbackRates to dependencies

    const handleSetCurrency = useCallback((newCurrency: Currency) => {
        console.log(`Setting currency to ${newCurrency}. Available currencies: ${availableCurrencies.join(', ')}`);
        console.log(`Current currency before setting: ${currency}`);

        // Force currency change regardless of availability to fix any potential issues
        setCurrency(newCurrency);
        console.log(`Currency state set to: ${newCurrency}`);

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, newCurrency);
                console.log(`Saved ${newCurrency} to localStorage under key ${storageKey}`);
                // Verify the storage was set correctly
                const verifyStorage = localStorage.getItem(storageKey);
                console.log(`Verification - localStorage now contains: ${verifyStorage}`);
            } catch (error) {
                console.error("Error saving currency to localStorage:", error);
            }
        }
    }, [availableCurrencies, storageKey, currency]); // Added currency as dependency

    const convertPrice = useCallback((priceInUSD: number): number => {
        if (!exchangeRates[currency]) return priceInUSD;
        const convertedPrice = priceInUSD * exchangeRates[currency];
        return currency === "JPY" ? Math.round(convertedPrice) : Math.round(convertedPrice * 100) / 100;
    }, [currency, exchangeRates]);

    const formatPrice = useCallback((price: number): string => {
        const currencySymbols: { [key in Currency]: string } = {
            USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥"
        };
        const symbol = currencySymbols[currency] || "$";
        try {
            const currencyFormatters: { [key in Currency]: string } = {
                USD: "en-US", EUR: "de-DE", GBP: "en-GB", AUD: "en-AU", CAD: "en-CA", JPY: "ja-JP"
            };
            const formatter = new Intl.NumberFormat(currencyFormatters[currency] || "en-US", {
                minimumFractionDigits: currency === "JPY" ? 0 : 2,
                maximumFractionDigits: currency === "JPY" ? 0 : 2,
            });
            return `${symbol}${formatter.format(price)}`;
        } catch (error) {
            if (currency === "JPY") {
                return `${symbol}${Math.round(price).toLocaleString()}`;
            }
            return `${symbol}${price.toFixed(2)}`;
        }
    }, [currency]);

    const contextValue = useMemo(() => ({
        currency,
        setCurrency: handleSetCurrency,
        exchangeRates,
        isLoading,
        isFallback,
        lastUpdated,
        convertPrice,
        formatPrice,
        availableCurrencies, // This is now the dynamic state
    }), [currency, handleSetCurrency, exchangeRates, isLoading, isFallback, lastUpdated, convertPrice, formatPrice, availableCurrencies]);

    return (
        <CurrencyProviderContext.Provider value={contextValue}>
            {children}
        </CurrencyProviderContext.Provider>
    );
}

export const useCurrency = () => {
    const context = useContext(CurrencyProviderContext);
    if (context === undefined)
        throw new Error("useCurrency must be used within a CurrencyProvider");
    return context;
};
