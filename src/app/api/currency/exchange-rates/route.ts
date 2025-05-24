import { NextRequest, NextResponse } from "next/server";

// Cache control for 1 hour - to avoid excessive API calls
export const revalidate = 3600;

// List of supported currencies to filter response
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "JPY"];

export async function GET(req: NextRequest) {
    try {
        // Get API key from environment variables
        const API_KEY = process.env.EXCHANGE_RATE_API_KEY || process.env.EXCHANGE_RATE_API_KEY;

        if (!API_KEY) {
            console.warn("No exchange rate API key found in environment variables");
            return useFallbackRates("API key not configured");
        }

        // We'll try multiple free API providers in case one fails
        const providers = [
            {
                name: "ExchangeRate-API",
                url: `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
                processResponse: async (response: Response) => {
                    const data = await response.json();
                    if (data.result === "success") {
                        return {
                            success: true,
                            base: "USD",
                            date: data.time_last_update_utc,
                            rates: filterRates(data.conversion_rates)
                        };
                    }
                    throw new Error(`API Error: ${data.error_type}`);
                }
            },
            {
                name: "Frankfurter",
                url: `https://api.frankfurter.app/latest?from=USD&to=${SUPPORTED_CURRENCIES.join(',')}`,
                processResponse: async (response: Response) => {
                    const data = await response.json();
                    return {
                        success: true,
                        base: "USD",
                        date: data.date,
                        rates: { USD: 1, ...data.rates }
                    };
                }
            },
            {
                name: "Open Exchange Rates",
                url: `https://openexchangerates.org/api/latest.json?app_id=${API_KEY}&base=USD`,
                processResponse: async (response: Response) => {
                    const data = await response.json();
                    if (data.base === "USD") {
                        return {
                            success: true,
                            base: "USD",
                            date: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
                            rates: filterRates(data.rates)
                        };
                    }
                    throw new Error("Unexpected API response");
                }
            }
        ];

        // Try each provider in sequence until one succeeds
        for (const provider of providers) {
            try {
                console.log(`Trying exchange rate provider: ${provider.name}`);
                const response = await fetch(provider.url, {
                    next: { revalidate: 3600 } // Cache for 1 hour
                });

                if (!response.ok) {
                    console.warn(`${provider.name} API responded with status: ${response.status}`);
                    continue; // Try next provider
                }

                const result = await provider.processResponse(response);
                console.log(`Successfully fetched rates from ${provider.name}`);
                return NextResponse.json(result);
            } catch (error) {
                console.error(`Error with ${provider.name}:`, error);
                // Continue to next provider
            }
        }

        // If all providers fail, use fallback rates
        return useFallbackRates("All API providers failed");
    } catch (error) {
        console.error("Unexpected error fetching exchange rates:", error);
        return useFallbackRates("Unexpected error");
    }
}

// Helper function to filter rates to only supported currencies
function filterRates(rates: Record<string, number>): Record<string, number> {
    const filteredRates: Record<string, number> = {};

    // Ensure USD is always 1
    filteredRates.USD = 1;

    // Add other supported currencies
    for (const currency of SUPPORTED_CURRENCIES) {
        if (currency !== "USD" && rates[currency]) {
            filteredRates[currency] = rates[currency];
        }
    }

    return filteredRates;
}

// Helper function to return fallback rates
function useFallbackRates(errorMessage: string) {
    console.warn(`Using fallback exchange rates: ${errorMessage}`);

    // Fallback rates - only used if all API calls fail
    const fallbackRates = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.51,
        CAD: 1.36,
        JPY: 154.35,
    };

    // Return fallback rates but indicate this is fallback data
    return NextResponse.json({
        success: true,
        base: "USD",
        date: new Date().toISOString(),
        rates: fallbackRates,
        isFallback: true,
        error: errorMessage
    });
}