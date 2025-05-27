import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

/**
 * Import a product from CJ Dropshipping
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }        // Parse request body
        const body = await request.json();
        const {
            supplierId,
            productId,
            categoryId,
            markup: rawMarkup = 0.3 // Default 30% markup
        } = body;

        // Ensure markup is a valid number and within reasonable range (0% to 500%)
        const markup = typeof rawMarkup === 'number' && !isNaN(rawMarkup) && rawMarkup >= 0 && rawMarkup <= 5
            ? rawMarkup
            : 0.3; // Default to 30% if invalid

        // Initialize variant tracking variables at the top of the function
        const variantTypes = new Set<string>();
        const variantsByType: Record<string, string[]> = {};

        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
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

        // Get category
        const category = await db.category.findUnique({
            where: { id: categoryId },
        }); if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId: supplier.id,
            apiKey: supplier.apiKey,
            apiEndpoint: supplier.apiEndpoint,
        }) as any; // Use 'any' to access custom methods        // DEBUGGING: Log the exact format of the product ID received
        console.log('===== PRODUCT ID FORMAT DEBUGGING =====');
        console.log(`Raw productId received: "${productId}"`);
        console.log(`productId type: ${typeof productId}`);
        console.log(`productId length: ${productId.length}`);
        console.log(`productId starts with 'pid:': ${productId.startsWith('pid:')}`);
        console.log(`productId includes "pid:pid:": ${productId.includes('pid:pid:')}`);

        // Try to clean the product ID before passing it to the API methods
        let cleanedProductId = productId;

        // Extract the numeric part of the product ID using regex
        const numericMatch = productId.match(/(\d+)/);
        if (numericMatch && numericMatch[1]) {
            const numericPart = numericMatch[1];
            // Always format consistently as pid:NUMBER:null
            cleanedProductId = `pid:${numericPart}:null`;
            console.log(`Extracted numeric part and formatted ID: ${cleanedProductId}`);
        } else if (productId.startsWith('pid:pid:')) {
            // Handle the specific double-prefix case as fallback
            const parts = productId.split(':');
            if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
                cleanedProductId = `pid:${parts[2]}:null`;
                console.log(`Fixed double-prefix (pid:pid:) in product ID before API call: ${cleanedProductId}`);
            }
        } else if (productId.includes('pid:')) {
            // Handle other prefix cases as fallback
            const parts = productId.split(':');
            if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                cleanedProductId = `pid:${parts[1]}:null`;
                console.log(`Normalized product ID format before API call: ${cleanedProductId}`);
            }
        } else if (/^\d+$/.test(productId)) {
            // If it's just a number, add the prefix and suffix
            cleanedProductId = `pid:${productId}:null`;
            console.log(`Added prefix/suffix to numeric product ID: ${cleanedProductId}`);
        }

        console.log('Attempting to get complete product information for product ID:', cleanedProductId);
        console.log('Using supplier API endpoint:', supplier.apiEndpoint);

        // Get complete product details from CJ Dropshipping including variants and descriptions
        let result;
        try {
            // Try to get complete information including variants, descriptions, etc.
            result = await client.getCompleteProductInformation(cleanedProductId);
            console.log('CJ Complete Product Information Retrieved');
        } catch (error) {
            console.error('Error getting complete product info, falling back to basic details:', error);            // Check if the client supports our new internal method
            if (typeof client.getProductDetailsWithRawPid === 'function') {
                // Use the new internal method that doesn't format the ID again
                result = await client.getProductDetailsWithRawPid(cleanedProductId);
                console.log('Used getProductDetailsWithRawPid for fallback');
            } else {
                // Fallback to basic product details if the new method is not available
                result = await client.getProductDetails(cleanedProductId);
                console.log('Used original getProductDetails for fallback');
            }
        } console.log('CJ Product Response Success:', result.success);
        if (!result.success || !result.product) {
            console.error('Failed to fetch product details:', result.error);
            return NextResponse.json({
                error: "Failed to fetch product details",
                details: result.error || "Product not found"
            }, { status: 400 });
        }

        // Using the actual result.product object from this point forward// Log important product data for debugging
        console.log('Product name:', result.product.productNameEn);
        console.log('Has description:', Boolean(result.product.productDescEn));
        console.log('Description length:', result.product.productDescEn?.length || 0);
        console.log('Variants count:', result.product.variants?.length || 0);

        // Reset variant tracking variables for this product
        variantTypes.clear();
        Object.keys(variantsByType).forEach(key => delete variantsByType[key]);

        // Calculate price with markup
        const costPrice = result.product.variants?.[0]?.variantSellPrice || result.product.sellPrice || 0;
        const price = Math.ceil((costPrice * (1 + markup)) * 100) / 100; // Round up to nearest cent

        // Create a unique slug
        const baseSlug = result.product.productNameEn.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug exists
        const slugExists = await db.product.findUnique({
            where: { slug: baseSlug },
        });

        // Append random ID if slug exists
        const slug = slugExists
            ? `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`
            : baseSlug;    // Enhanced logging for debugging description issues
        console.log('------ PRODUCT DESCRIPTION DEBUG ------');
        console.log('Raw product description length:', (result.product.productDescEn || '').length);
        console.log('Sample of description (first 100 chars):', (result.product.productDescEn || '').substring(0, 100));
        console.log('Description type:', typeof result.product.productDescEn);
        console.log('----------------------------------------');

        // Process the description - ensure it's properly sanitized but preserves HTML
        let sanitizedDescription = result.product.productDescEn || "";

        // If the description is empty, check if there's a product description in another field
        if (!sanitizedDescription && result.product.description) {
            sanitizedDescription = result.product.description;
        }

        // If still no description, create a basic description from available product data
        if (!sanitizedDescription) {
            // Try to build a description from product details
            sanitizedDescription = `<p>Overview:</p>
 <p>${result.product.productNameEn || 'Unique, charming, fashionable, and elegant product'} that is perfect for casual shopping, dating, party, and vacation.</p>
 <p><strong>Features:</strong></p>
 <ul>
   <li>High quality materials</li>
   <li>Fashionable design</li>
   <li>Comfortable to wear</li>
 </ul>
 <p><strong>Notes:</strong></p>
 <ul>
   <li>Please check the size chart carefully before ordering</li>
   <li>Please allow slight measurement deviation due to manual measurement</li>
   <li>Due to the different monitor and light effect, the actual color might be slightly different from the picture</li>
 </ul>`;
        }    // Log final description for debugging
        console.log("Final description length being saved:", sanitizedDescription.length);
        console.log("Description sample:", sanitizedDescription.substring(0, 100) + "...");

        // Prepare variant types data for storage
        const variantTypesJson = Object.keys(variantsByType).length > 0 ?
            JSON.stringify(variantsByType) : null;

        // Create the product in our database
        const product = await db.product.create({
            data: {
                name: result.product.productNameEn,
                slug,
                description: sanitizedDescription,
                price,
                costPrice,
                inventory: 999, // Default inventory for dropshipping
                categoryId,
                supplierId: supplier.id,
                supplierProductId: productId,
                supplierUrl: result.product.productLink || "",
                supplierSource: supplier.name,
                shippingTime: `${result.product.shippingTime || "7-14"} days`,
                profitMargin: markup,
                isPublished: false, // Default to unpublished until review
                updatedAt: new Date(),
                weight: result.product.packWeight || 0,
                dimensions: result.product.packLength && result.product.packWidth && result.product.packHeight
                    ? `${result.product.packLength}x${result.product.packWidth}x${result.product.packHeight}`
                    : null,
                sku: result.product.sku || `CJ-${productId}`,
                brand: result.product.entryNameEn || "Generic",
                variantTypes: variantTypesJson, // Store structured variant data
            },
        });    // Create product images
        if (result.product.productImageSet && Array.isArray(result.product.productImageSet)) {
            for (let i = 0; i < result.product.productImageSet.length; i++) {
                await db.productImage.create({
                    data: {
                        productId: product.id,
                        url: result.product.productImageSet[i],
                        alt: `${product.name} - Image ${i + 1}`,
                        position: i,
                        updatedAt: new Date(),
                    }
                });
            }
        }

        // Create product variants if they exist
        if (result.product.variants && Array.isArray(result.product.variants) && result.product.variants.length > 0) {
            // Extract variant types from the variants
            console.log('Processing variants:', result.product.variants);

            // First pass: Parse all variants to extract all variant types and options
            // Some CJ variants might include multiple properties like "Color:Red,Size:XL"
            // while others might use a different format or single properties
            for (const variant of result.product.variants) {
                // Skip variants without proper data
                if (!variant.variantNameEn) continue;

                // Handle comma-separated variant format (e.g., "Color:Red,Size:XL")
                if (variant.variantNameEn.includes(':') && variant.variantNameEn.includes(',')) {
                    // Get variant properties from name (e.g., "Color:Red,Size:XL" -> ["Color:Red", "Size:XL"])
                    const properties = variant.variantNameEn.split(',').map(prop => prop.trim());

                    // Process each property (Color:Red, Size:XL, etc.)
                    for (const prop of properties) {
                        const [type, value] = prop.split(':').map(p => p.trim());

                        if (type && value) {
                            // Add type to set of variant types
                            variantTypes.add(type);

                            // Initialize array for this type if it doesn't exist
                            if (!variantsByType[type]) {
                                variantsByType[type] = [];
                            }

                            // Add value to array if it doesn't exist already
                            if (!variantsByType[type].includes(value)) {
                                variantsByType[type].push(value);
                            }
                        }
                    }
                }
                // Handle simpler variant format without specific type (just option names)
                else {
                    // Use a default type name if no structured format is found
                    const defaultType = "Option";
                    variantTypes.add(defaultType);

                    if (!variantsByType[defaultType]) {
                        variantsByType[defaultType] = [];
                    }

                    if (!variantsByType[defaultType].includes(variant.variantNameEn)) {
                        variantsByType[defaultType].push(variant.variantNameEn);
                    }
                }
            } console.log('Extracted variant types:', Array.from(variantTypes));
            console.log('Variants by type:', variantsByType);

            // Create product variants in our database
            for (const variant of result.product.variants) {
                if (!variant.variantNameEn) continue;

                const variantCost = variant.variantSellPrice || costPrice;
                const variantPrice = Math.ceil((variantCost * (1 + markup)) * 100) / 100;

                // Extract variant properties and determine the main type
                let mainType = "Option"; // Default type if no structure is detected
                const options: Record<string, string> = {};

                // For variants with structured data like "Color:Red,Size:XL"
                if (variant.variantNameEn.includes(':') && variant.variantNameEn.includes(',')) {
                    const properties = variant.variantNameEn.split(',').map(prop => prop.trim());

                    for (const prop of properties) {
                        const parts = prop.split(':').map(p => p.trim());
                        if (parts.length === 2) {
                            const [type, value] = parts;
                            if (type && value) {
                                options[type] = value;
                            }
                        }
                    }

                    // Use the first property type as the main type
                    if (Object.keys(options).length > 0) {
                        mainType = Object.keys(options)[0];
                    }
                }
                // For simple variants without a type:value structure
                else {
                    options[mainType] = variant.variantNameEn;
                }

                // Log variant processing for debugging
                console.log(`Creating variant: ${variant.variantNameEn}, Type: ${mainType}, Price: ${variantPrice}`);

                await db.productVariant.create({
                    data: {
                        productId: product.id,
                        name: variant.variantNameEn,
                        price: variantPrice,
                        costPrice: variantCost,
                        inventory: 999,
                        sku: variant.sku || `CJ-${productId}-${variant.vid}`,
                        image: variant.variantImage || result.product.productImageSet?.[0] || "",
                        options: JSON.stringify(options), // Store structured options
                        type: mainType, // Use determined main type
                        updatedAt: new Date(),
                    }
                });
            }        // Store the variant structure for the product
            if (Object.keys(variantsByType).length > 0) {
                await db.product.update({
                    where: { id: product.id },
                    data: {
                        variantTypes: JSON.stringify(variantsByType),
                    }
                });
            }
        }

        // Log admin action
        await logAdminAction(
            "product_import",
            `Admin imported product from CJ Dropshipping: ${product.name}`,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
            }
        });
    } catch (error: any) {
        console.error("Error importing CJ Dropshipping product:", error);
        return NextResponse.json(
            {
                error: "Failed to import product",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}