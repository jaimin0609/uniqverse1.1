import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";
import { CJTokenStore } from "@/services/dropshipping/cj-token-store";
import { db } from "@/lib/db";

/**
 * Search for products in CJ Dropshipping
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get search parameters from query
        const searchParams = request.nextUrl.searchParams;
        const supplierId = searchParams.get('supplierId');
        const query = searchParams.get('query') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Make sure supplier ID is provided
        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }        // Check if rate limit is active using the token store
        const tokenStore = CJTokenStore.getInstance();
        const timeUntilAuth = await tokenStore.getTimeUntilNextAuth(supplierId);
        if (timeUntilAuth > 0) {
            return NextResponse.json({
                success: false,
                error: "Rate limit in effect",
                rateLimitSeconds: timeUntilAuth,
                rateLimitMessage: `CJ Dropshipping API rate limit is active. Please wait ${timeUntilAuth} seconds before trying again.`
            }, { status: 429 }); // 429 Too Many Requests
        }

        // Get supplier details
        const supplier = await db.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        if (!supplier.apiKey || !supplier.apiEndpoint) {
            return NextResponse.json({ error: "Supplier API not configured" }, { status: 400 });
        }

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId: supplier.id,
            apiKey: supplier.apiKey,
            apiEndpoint: supplier.apiEndpoint,
        }) as any; // Use 'any' to access custom methods

        // Set up search parameters
        const searchOptions: any = {
            pageNum: page,
            pageSize: limit,
        };

        // Add query (product name search) if provided
        if (query && query.trim() !== '') {
            searchOptions.productNameEn = query;
        }

        // Add category ID if provided
        if (categoryId && categoryId !== 'all') {
            searchOptions.categoryId = categoryId;
        }

        // Search for products
        const result = await client.searchProducts(searchOptions);

        if (result.success) {
            // Process the products to ensure price fields are properly formatted
            if (result.products && Array.isArray(result.products)) {
                result.products = result.products.map((product: any) => {
                    // Ensure sellPrice is a number (CJ API can return it as string or number)
                    if (product.sellPrice !== undefined) {
                        product.sellPrice = typeof product.sellPrice === 'string'
                            ? parseFloat(product.sellPrice)
                            : Number(product.sellPrice);
                    } else {
                        // If sellPrice is missing, try to get it from variants or set to 0
                        if (product.variants && product.variants.length > 0 && product.variants[0].variantSellPrice) {
                            product.sellPrice = typeof product.variants[0].variantSellPrice === 'string'
                                ? parseFloat(product.variants[0].variantSellPrice)
                                : Number(product.variants[0].variantSellPrice);
                        } else {
                            product.sellPrice = 0;
                        }
                    }

                    return product;
                });
            }

            return NextResponse.json(result);
        } else {
            // Check if it's a rate limit error
            if (result.error && result.error.includes('CJ_RATE_LIMIT:')) {
                // Extract wait time from error message
                const match = result.error.match(/CJ_RATE_LIMIT:(\d+):/);
                const waitTime = match ? parseInt(match[1]) : 300; // Default to 5 minutes if we can't parse

                return NextResponse.json({
                    success: false,
                    error: "Rate limit reached",
                    rateLimitSeconds: waitTime,
                    rateLimitMessage: `CJ Dropshipping API rate limit reached. Please wait ${waitTime} seconds before trying again.`
                }, { status: 429 }); // 429 Too Many Requests
            }

            return NextResponse.json({
                success: false,
                error: result.error || "Failed to search products"
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Error searching CJ Dropshipping products:", error);

        // Check for rate limit error
        if (error.message && error.message.includes('CJ_RATE_LIMIT:')) {
            // Extract wait time from error message
            const match = error.message.match(/CJ_RATE_LIMIT:(\d+):/);
            const waitTime = match ? parseInt(match[1]) : 300; // Default to 5 minutes if we can't parse

            return NextResponse.json({
                success: false,
                error: "Rate limit reached",
                rateLimitSeconds: waitTime,
                rateLimitMessage: `CJ Dropshipping API rate limit reached. Please wait ${waitTime} seconds before trying again.`
            }, { status: 429 }); // 429 Too Many Requests
        }

        return NextResponse.json(
            {
                success: false,
                error: "Failed to search products",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}