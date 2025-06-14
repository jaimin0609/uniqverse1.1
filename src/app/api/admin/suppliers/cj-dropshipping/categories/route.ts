import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";
import { CJTokenStore } from "@/services/dropshipping/cj-token-store";
import { db } from "@/lib/db";

/**
 * Fetch categories from CJ Dropshipping
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get supplier ID from query
        const searchParams = request.nextUrl.searchParams;
        const supplierId = searchParams.get('supplierId');

        // Make sure supplier ID is provided
        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        // Check if rate limit is active using the token store
        const tokenStore = CJTokenStore.getInstance();
        const timeUntilAuth = tokenStore.getTimeUntilNextAuth(supplierId);
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
        }) as any; // Use 'any' to access custom methods        // Fetch categories from CJ Dropshipping
        console.log('Calling CJ Dropshipping getCategories API method');

        // For force refresh, we'll clear the cache if the forceRefresh parameter is set
        const forceRefresh = request.nextUrl.searchParams.get('forceRefresh') === 'true';
        if (forceRefresh && typeof client.clearCategoryCache === 'function') {
            client.clearCategoryCache();
        }

        try {
            const result = await client.getCategories();
            console.log('Categories API call result:', result);

            if (result.success) {
                // Add debugging
                console.log(`Successfully retrieved ${result.categories.length} categories${result.cached ? ' (from cache)' : ''}`);                // Process the nested CJ Dropshipping category structure
                const flattenedCategories: Array<{ id: any, name: any, slug: string }> = [];

                // First level categories (categoryFirst)
                for (const firstLevelCat of result.categories) {
                    // Add the first level category
                    flattenedCategories.push({
                        id: firstLevelCat.categoryFirstId,
                        name: firstLevelCat.categoryFirstName,
                        slug: firstLevelCat.categoryFirstName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    });

                    // Process second level categories if they exist
                    if (firstLevelCat.categoryFirstList && Array.isArray(firstLevelCat.categoryFirstList)) {
                        for (const secondLevelCat of firstLevelCat.categoryFirstList) {
                            if (secondLevelCat.categorySecondId && secondLevelCat.categorySecondName) {
                                flattenedCategories.push({
                                    id: secondLevelCat.categorySecondId,
                                    name: `${firstLevelCat.categoryFirstName} > ${secondLevelCat.categorySecondName}`,
                                    slug: `${firstLevelCat.categoryFirstName}-${secondLevelCat.categorySecondName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                });

                                // Process third level categories if they exist
                                if (secondLevelCat.categorySecondList && Array.isArray(secondLevelCat.categorySecondList)) {
                                    for (const thirdLevelCat of secondLevelCat.categorySecondList) {
                                        if (thirdLevelCat.categoryId && thirdLevelCat.categoryName) {
                                            flattenedCategories.push({
                                                id: thirdLevelCat.categoryId,
                                                name: `${firstLevelCat.categoryFirstName} > ${secondLevelCat.categorySecondName} > ${thirdLevelCat.categoryName}`,
                                                slug: `${firstLevelCat.categoryFirstName}-${secondLevelCat.categorySecondName}-${thirdLevelCat.categoryName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                return NextResponse.json({
                    success: true,
                    categories: flattenedCategories
                });
            } else {
                // Check if it's a rate limit error
                if (result.error && result.error.includes('CJ_RATE_LIMIT:')) {
                    // Extract wait time from error message
                    const match = result.error.match(/CJ_RATE_LIMIT:(\d+):/);
                    const waitTime = match ? parseInt(match[1]) : 300; // Default to 5 minutes if we can't parse

                    console.log(`Rate limit error encountered with wait time: ${waitTime}s`);
                    return NextResponse.json({
                        success: false,
                        error: "Rate limit reached",
                        rateLimitSeconds: waitTime,
                        rateLimitMessage: `CJ Dropshipping API rate limit reached. Please wait ${waitTime} seconds before trying again.`
                    }, { status: 429 }); // 429 Too Many Requests
                }

                console.error('Failed to fetch categories:', result.error);
                return NextResponse.json({
                    success: false,
                    error: result.error || "Failed to fetch categories"
                }, { status: 400 });
            }
        } catch (error) {
            console.error('Exception caught while fetching categories:', error);
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error fetching categories"
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Error fetching CJ Dropshipping categories:", error);

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
                error: "Failed to fetch categories",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
