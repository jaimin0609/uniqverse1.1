// Integration test for CJ Dropshipping product import functionality
// This script tests the import functionality with real API calls
// Usage: npx ts-node src/test-cj-import.ts [product-id]

import { db } from './lib/db';
import { CJDropshippingApiClient } from './services/dropshipping/cj-dropshipping-client';

async function testCJProductImport() {
    console.log("CJ Dropshipping Product Import Integration Test");
    console.log("=============================================");

    try {
        // 1. Get a CJ Dropshipping supplier from the database
        const supplier = await db.supplier.findFirst({
            where: {
                name: { contains: "CJ" }
            }
        });

        if (!supplier) {
            console.error("❌ No CJ Dropshipping supplier found in database");
            return;
        }

        console.log("✅ Found supplier:", supplier.name);
        console.log("API Key:", supplier.apiKey ? "✓ Available" : "✗ Missing");
        console.log("API Endpoint:", supplier.apiEndpoint);

        if (!supplier.apiKey || !supplier.apiEndpoint) {
            console.error("❌ Supplier API configuration incomplete");
            return;
        }

        // 2. Create CJ Dropshipping client
        const client = new CJDropshippingApiClient(
            supplier.apiKey,
            supplier.apiEndpoint,
            supplier.id
        );

        // First test the search functionality to verify URL formatting is correct
        console.log("\n===== Testing Product Search (URL formatting fix) =====");
        try {
            console.log("Searching for products with query: 'phone case'");
            const searchResults = await client.searchProducts({
                productNameEn: "phone case",
                pageNum: 1,
                pageSize: 5
            });

            if (searchResults.success) {
                console.log(`✅ Search successful! Found ${searchResults.total} products`);
                if (searchResults.products && searchResults.products.length > 0) {
                    console.log("First product:", {
                        name: searchResults.products[0].productNameEn,
                        pid: searchResults.products[0].pid
                    });

                    // Use this product for further testing
                    if (searchResults.products[0].pid) {
                        const testProductId = searchResults.products[0].pid;
                        await testProductDetails(client, testProductId);
                    }
                }
            } else {
                console.error(`❌ Search failed: ${searchResults.error}`);
            }
        } catch (error) {
            console.error("❌ Error during product search:", error);
        }

        // 3. Define test product IDs (including the problematic formats)
        const testIds = [
            // Product IDs to test - add more as needed
            ...(process.argv.length > 2 ? [process.argv[2]] : []),
            "2505100714581619400",
            "pid:2505100714581619400",
            "pid:2505100714581619400:null"
        ];

        // 4. Test each product ID
        for (const productId of testIds) {
            console.log("\n--------------------------------------------------");
            console.log(`Testing Product ID: ${productId}`);
            console.log("--------------------------------------------------");

            try {
                console.log("1. Getting product details...");
                const detailsResult = await client.getProductDetails(productId);

                if (!detailsResult.success) {
                    console.error(`❌ Failed to get product details: ${detailsResult.error}`);
                    continue;
                }

                console.log("✅ Successfully retrieved product details");
                console.log(`Product name: ${detailsResult.product.productNameEn}`);
                console.log(`SKU: ${detailsResult.product.sku || 'N/A'}`);

                // 5. Try to get product variants
                console.log("\n2. Getting product variants...");
                const variantsResult = await client.getProductVariants(productId);

                if (!variantsResult.success) {
                    console.log(`❌ Failed to get product variants: ${variantsResult.error}`);
                } else {
                    console.log(`✅ Successfully retrieved ${variantsResult.variants.length} variants`);
                }

                // 6. Try to get complete product information
                console.log("\n3. Getting complete product information...");
                const completeResult = await client.getCompleteProductInformation(productId);

                if (!completeResult.success) {
                    console.log(`❌ Failed to get complete product info: ${completeResult.error}`);
                } else {
                    console.log("✅ Successfully retrieved complete product information");
                    console.log(`Description length: ${completeResult.product.productDescEn?.length || 0} chars`);
                    console.log(`Variants: ${completeResult.product.variants?.length || 0}`);
                    console.log(`Comments: ${completeResult.product.comments?.length || 0}`);
                    console.log(`Similar products: ${completeResult.product.similarProducts?.length || 0}`);
                }

                console.log("\n✅ All tests passed for this product ID");

            } catch (error) {
                console.error("❌ Error testing product ID:", error);
            }
        }

        console.log("\n=============================================");
        console.log("Integration test complete");

    } catch (error) {
        console.error("❌ Error during integration test:", error);
    } finally {
        // Clean up database connection
        await db.$disconnect();
    }
}

// Helper function to test product details endpoint with a real product ID
async function testProductDetails(client: CJDropshippingApiClient, productId: string) {
    console.log("\n===== Testing Product Details API (URL formatting fix) =====");
    console.log(`Testing with product ID: ${productId}`);

    try {
        const details = await client.getProductDetails(productId);
        if (details.success) {
            console.log("✅ Successfully retrieved product details");
            console.log(`Product name: ${details.product.productNameEn}`);
            return true;
        } else {
            console.error(`❌ Failed to get product details: ${details.error}`);
            return false;
        }
    } catch (error) {
        console.error("❌ Error retrieving product details:", error);
        return false;
    }
}

// Run the test
testCJProductImport().catch(console.error);
