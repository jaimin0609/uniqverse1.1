// Test script for the CJ Dropshipping import functionality
import { createSupplierApiClient, CJDropshippingApiClient } from '@/services/dropshipping/supplier-api-client';
import 'dotenv/config';

async function testCJDropshippingImport() {
    console.log('Starting CJ Dropshipping Import Test');

    try {
        // Get supplier details from environment or use test values
        const supplierId = process.env.TEST_SUPPLIER_ID || 'test-supplier-id';
        const apiKey = process.env.CJ_API_KEY || 'test-api-key';
        const apiEndpoint = process.env.CJ_API_ENDPOINT || 'https://developers.cjdropshipping.com/api2.0/';
        const testProductId = process.env.TEST_PRODUCT_ID || 'pid:12345:null';

        console.log(`Testing with supplier ID: ${supplierId}`);
        console.log(`Testing with product ID: ${testProductId}`);

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId,
            apiKey,
            apiEndpoint,
        }) as CJDropshippingApiClient;

        console.log('Client created, testing connection...');

        // Test connection
        const connectionTest = await client.testConnection();
        console.log('Connection test result:', connectionTest);

        if (!connectionTest) {
            throw new Error('Connection test failed');
        }

        // Get complete product information
        console.log('Getting complete product information...');
        const result = await client.getCompleteProductInformation(testProductId);

        console.log('API Response:', JSON.stringify(result, null, 2));

        if (!result.success) {
            throw new Error(`Failed to get product details: ${result.error}`);
        }

        console.log('Test completed successfully');
        console.log('Product details:');
        console.log(`- Name: ${result.product.productNameEn}`);
        console.log(`- SKU: ${result.product.productSku}`);
        console.log(`- Price: ${result.product.sellPrice}`);
        console.log(`- Variants: ${result.product.variants?.length || 0}`);

        return result;
    } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
    }
}

// Run the test
testCJDropshippingImport()
    .then(() => {
        console.log('Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
