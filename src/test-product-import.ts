import { db } from "./lib/db";
import { createSupplierApiClient } from "./services/dropshipping/supplier-api-client";
import fs from 'fs';
import path from 'path';

// This is a simple script to test the product import process
async function testProductImport() {
    try {
        // Get a test supplier
        const supplier = await db.supplier.findFirst({
            where: {
                name: { contains: "CJ" }
            }
        });

        if (!supplier) {
            console.log("No CJ supplier found in the database.");
            return;
        }

        console.log("Found supplier:", supplier.name);

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId: supplier.id,
            apiKey: supplier.apiKey || "",
            apiEndpoint: supplier.apiEndpoint || "",
        }) as any; // Use 'any' to access custom methods

        // Test product ID - replace with an actual product ID from CJ Dropshipping
        const productId = "1626704132557549568"; // Example ID

        // Get complete product details
        console.log("Getting product information...");
        const result = await client.getCompleteProductInformation(productId);

        if (!result.success || !result.product) {
            console.error("Failed to fetch product:", result.error);
            return;
        }

        // Log important product data
        const product = result.product;
        console.log("-------------------------------");
        console.log("Product name:", product.productNameEn);
        console.log("-------------------------------");
        console.log("Description available:", Boolean(product.productDescEn));
        console.log("Description length:", product.productDescEn?.length || 0);
        console.log("Description contains HTML:", product.productDescEn?.includes("<"));
        console.log("Description excerpt:", product.productDescEn?.substring(0, 200));

        // Save the full description to a file for inspection
        if (product.productDescEn) {
            const debugDir = path.join(process.cwd(), 'debug');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir);
            }
            fs.writeFileSync(
                path.join(debugDir, 'cj-product-description.html'),
                product.productDescEn
            );
            console.log("Full description saved to debug/cj-product-description.html");
        }

        if (product.variants && product.variants.length > 0) {
            console.log("First variant:", product.variants[0]);
        }

        console.log("-------------------------------");
        console.log("Test complete!");
    } catch (error) {
        console.error("Test failed with error:", error);
    } finally {
        // Disconnect from the database
        await db.$disconnect();
    }
}

// Run the test
testProductImport().catch(console.error);
