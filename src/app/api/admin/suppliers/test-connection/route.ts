import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { logAdminAction } from "@/lib/admin-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";

// Utility to safely fetch from external APIs with proper error handling
async function safeFetch(url: string, options: RequestInit = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Get response details
        const status = response.status;
        const statusText = response.statusText;
        const ok = response.ok;

        // Try to get response body (but don't fail if it's not valid JSON)
        let body;
        try {
            body = await response.json();
        } catch (e) {
            // Not JSON or empty response, that's fine for testing
            body = null;
        }

        return {
            status,
            statusText,
            ok,
            body,
        };
    } catch (error: any) {
        return {
            ok: false,
            status: 0,
            statusText: error.name === 'AbortError' ? 'Request timed out' : error.message,
            error: error.message || 'Connection failed',
        };
    }
}

// Test connection handler that works with various supplier APIs
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.apiEndpoint) {
            return NextResponse.json(
                { error: "API endpoint URL is required" },
                { status: 400 }
            );
        }

        // Basic validation for the endpoint URL
        try {
            new URL(data.apiEndpoint);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid API endpoint URL" },
                { status: 400 }
            );
        }

        // Check if we have any authentication method
        const hasAuth = data.apiKey ||
            (data.apiUsername && data.apiPassword) ||
            data.apiHeaderAuth;

        if (!hasAuth) {
            return NextResponse.json(
                { error: "API authentication credentials required" },
                { status: 400 }
            );
        }

        // Generate a temp ID for testing purposes
        const tempSupplierId = "test-supplier-" + Date.now().toString();

        // Log the test attempt
        await logAdminAction(
            "supplier_api_test",
            `Admin tested API connection to: ${data.apiEndpoint}`,
            session.user.id
        );

        // For CJ Dropshipping, use our specialized client with test method
        if (data.apiEndpoint.includes('cjdropshipping')) {
            try {
                console.log("Testing CJ Dropshipping connection...");
                // Create the CJ Dropshipping client
                const client = createSupplierApiClient({
                    supplierId: tempSupplierId,
                    apiKey: data.apiKey,
                    apiEndpoint: data.apiEndpoint
                });

                // Test the connection using our specialized method
                // The CJDropshippingApiClient will have a testConnection method
                const success = await (client as any).testConnection();

                if (success) {
                    return NextResponse.json({
                        success: true,
                        message: "Successfully connected to CJ Dropshipping API",
                        supplierName: "CJ Dropshipping",
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        error: "Failed to connect to CJ Dropshipping API. Please check your API token."
                    });
                }
            } catch (error: any) {
                console.error("CJ Dropshipping test error:", error);
                return NextResponse.json({
                    success: false,
                    error: `CJ Dropshipping API error: ${error.message}`
                });
            }
        }

        // Prepare headers based on authentication type
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if (data.apiKey) {
            // Most APIs use Authorization header with API key or custom header
            if (data.apiEndpoint.includes('aliexpress')) {
                headers['X-API-KEY'] = data.apiKey;
            } else if (data.apiEndpoint.includes('spocket')) {
                headers['Authorization'] = `Bearer ${data.apiKey}`;
            } else {
                // Default behavior for most APIs
                headers['Authorization'] = `Bearer ${data.apiKey}`;
            }

            // Add Secret if provided (used by some APIs)
            if (data.apiSecret) {
                headers['X-API-SECRET'] = data.apiSecret;
            }
        } else if (data.apiUsername && data.apiPassword) {
            // Basic auth
            const basicAuth = Buffer.from(`${data.apiUsername}:${data.apiPassword}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
        } else if (data.apiHeaderAuth) {
            // Custom header auth
            headers['Authorization'] = data.apiHeaderAuth;
        }

        // Determine the test endpoint based on the API
        let testEndpoint = data.apiEndpoint;
        if (!testEndpoint.endsWith('/')) {
            testEndpoint += '/';
        }

        if (data.apiEndpoint.includes('aliexpress')) {
            testEndpoint += 'ping';
        } else if (data.apiEndpoint.includes('spocket')) {
            testEndpoint += 'profile';
        } else if (data.apiEndpoint.includes('oberlo')) {
            testEndpoint += 'products';
        } else if (data.apiEndpoint.includes('modalyst')) {
            testEndpoint += 'suppliers';
        } else {
            // Generic endpoint for custom APIs - try different common endpoints
            testEndpoint += 'status';
        }

        // Try to connect to the API
        const result = await safeFetch(testEndpoint, {
            method: 'GET',
            headers,
        });

        if (result.ok) {
            return NextResponse.json({
                success: true,
                message: `Successfully connected to API with status ${result.status}`,
                supplierName: extractSupplierNameFromEndpoint(data.apiEndpoint),
            });
        } else {
            // If primary test endpoint failed, try a secondary common endpoint
            let secondaryEndpoint = data.apiEndpoint;
            if (!secondaryEndpoint.endsWith('/')) {
                secondaryEndpoint += '/';
            }

            // Try a different common endpoint
            secondaryEndpoint += 'api/v1/products';

            const secondaryResult = await safeFetch(secondaryEndpoint, {
                method: 'GET',
                headers,
            });

            if (secondaryResult.ok) {
                return NextResponse.json({
                    success: true,
                    message: `Successfully connected to API with status ${secondaryResult.status}`,
                    supplierName: extractSupplierNameFromEndpoint(data.apiEndpoint),
                });
            }

            // Both attempts failed
            return NextResponse.json({
                success: false,
                error: result.error || `API responded with status ${result.status}`,
            });
        }
    } catch (error: any) {
        console.error("Error testing supplier API connection:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "An unexpected error occurred"
            },
            { status: 500 }
        );
    }
}

// Helper to extract a supplier name from API endpoint for better UX
function extractSupplierNameFromEndpoint(endpoint: string): string {
    try {
        const url = new URL(endpoint);
        const domain = url.hostname;

        // Extract the main domain name without subdomain and TLD
        const parts = domain.split('.');
        let mainDomain = parts.length >= 2 ? parts[parts.length - 2] : domain;

        // Convert to title case
        mainDomain = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);

        return mainDomain;
    } catch (error) {
        // Return a generic name if URL parsing fails
        return "Supplier";
    }
}