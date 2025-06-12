import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";
import { CJTokenStore } from "@/services/dropshipping/cj-token-store";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

interface ImportResult {
    productId: string;
    success: boolean;
    error?: string;
    existingProductId?: string;
    productDbId?: string;
    productName?: string;
}

/**
 * Bulk import products from CJ Dropshipping
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get data from request body
        const data = await request.json();
        const { supplierId, categoryId, productIds, markup: rawMarkup = 0.3 } = data; // Default 30% markup if not provided

        // Ensure markup is a valid number and within reasonable range
        const markup = typeof rawMarkup === 'number' && !isNaN(rawMarkup) && rawMarkup >= 0 && rawMarkup <= 5
            ? rawMarkup
            : 0.3; // Default to 30% if invalid

        // Validate required fields
        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: "Product IDs are required" }, { status: 400 });
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

        // Get category
        const category = await db.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId: supplier.id,
            apiKey: supplier.apiKey,
            apiEndpoint: supplier.apiEndpoint,
        }) as any; // Use 'any' to access custom methods        // Filter out any null, undefined or empty product IDs
        const validProductIds = productIds.filter(id => id && id.trim().length > 0);

        if (validProductIds.length === 0) {
            return NextResponse.json({
                error: "No valid product IDs provided",
                details: "The list of product IDs contained only invalid entries"
            }, { status: 400 });
        } console.log(`Processing ${validProductIds.length} products with rate limiting`);

        // Process the products sequentially with rate limiting to comply with CJ API limits
        const importResults: ImportResult[] = [];
        const now = new Date(); // Use the same date for all createdAt/updatedAt fields

        // Rate limiting: CJ Dropshipping allows 1 request per second
        const RATE_LIMIT_DELAY = 1100; // 1.1 seconds to be safe
        let lastRequestTime = 0;

        for (let i = 0; i < validProductIds.length; i++) {
            const productId = validProductIds[i];

            // Implement rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;
            if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
                const delayNeeded = RATE_LIMIT_DELAY - timeSinceLastRequest;
                console.log(`Rate limiting: waiting ${delayNeeded}ms before next request`);
                await new Promise(resolve => setTimeout(resolve, delayNeeded));
            }
            lastRequestTime = Date.now();

            console.log(`Processing product ${i + 1}/${validProductIds.length}: ${productId}`);

            try {
                // Clean up the product ID format using more robust handling
                let cleanedProductId = productId;

                // Extract the numeric part of the product ID using regex
                const numericMatch = productId.match(/(\d+)/);
                if (numericMatch && numericMatch[1]) {
                    const numericPart = numericMatch[1];
                    // Always format consistently as pid:NUMBER:null
                    cleanedProductId = `pid:${numericPart}:null`;
                } else if (productId.startsWith('pid:pid:')) {
                    // Handle the specific double-prefix case as fallback
                    const parts = productId.split(':');
                    if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
                        cleanedProductId = `pid:${parts[2]}:null`;
                    }
                } else if (productId.includes('pid:')) {
                    // Handle other prefix cases as fallback
                    const parts = productId.split(':');
                    if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                        cleanedProductId = `pid:${parts[1]}:null`;
                    }
                } else if (/^\d+$/.test(productId)) {
                    // If it's just a number, add the prefix and suffix
                    cleanedProductId = `pid:${productId}:null`;
                }                // Get complete product information
                const result = await client.getCompleteProductInformation(cleanedProductId);

                if (!result.success || !result.product) {
                    importResults.push({
                        productId,
                        success: false,
                        error: result.error || "Product not found in CJ Dropshipping"
                    });
                    continue; // Skip to next product
                }

                // Extract product data from the result
                const product = result.product;

                // Check if the product already exists
                const existingProduct = await db.product.findFirst({
                    where: {
                        supplierProductId: cleanedProductId,
                    },
                });

                if (existingProduct) {
                    importResults.push({
                        productId,
                        success: false,
                        error: "Product already exists in the database",
                        existingProductId: existingProduct.id
                    });
                    continue; // Skip to next product
                }

                // Generate a unique slug from the product name
                const baseSlug = product.productNameEn.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                // Add random suffix to ensure uniqueness
                const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

                // Calculate price with markup (similar to single import logic)
                const costPrice = parseFloat(product.sellPrice) || 0;
                const markupMultiplier = 1 + markup; // Convert percentage to multiplier
                const price = Math.ceil((costPrice * markupMultiplier) * 100) / 100; // Round up to nearest cent
                const compareAtPrice = Math.ceil((costPrice * (markupMultiplier + 0.5)) * 100) / 100; // Add extra 50% for compare price

                // Use transaction to ensure atomicity of the database operations
                const newProduct = await db.$transaction(async (tx) => {
                    // Create the product in the database
                    const newProduct = await tx.product.create({
                        data: {
                            name: product.productNameEn,
                            slug: slug,
                            description: product.description || "",
                            price: price,
                            costPrice: costPrice,
                            compareAtPrice: compareAtPrice,
                            sku: product.productSku || `CJ-${Date.now()}`,
                            barcode: product.ean || "",
                            inventory: 999, // Use dropshipping inventory
                            weight: product.weight || 0,
                            dimensions: `${product.length || 0}x${product.width || 0}x${product.height || 0}`,
                            isPublished: false, // Default to unpublished
                            categoryId: categoryId,
                            supplierId: supplierId,
                            supplierProductId: cleanedProductId,
                            profitMargin: markup, // Save the markup percentage
                            createdAt: now,
                            updatedAt: now,
                        }
                    });

                    // Add product images
                    if (product.productImage) {
                        await tx.productImage.create({
                            data: {
                                productId: newProduct.id,
                                url: product.productImage,
                                position: 1,
                                alt: product.productNameEn || "Product Image",
                                createdAt: now,
                                updatedAt: now,
                            },
                        });
                    }

                    // Add additional images if available
                    if (product.productImageSet && Array.isArray(product.productImageSet)) {
                        for (let imgIndex = 0; imgIndex < product.productImageSet.length; imgIndex++) {
                            const imageUrl = product.productImageSet[imgIndex];
                            if (imageUrl && imageUrl !== product.productImage) {
                                await tx.productImage.create({
                                    data: {
                                        productId: newProduct.id,
                                        url: imageUrl,
                                        position: imgIndex + 2, // Start from position 2
                                        alt: `${product.productNameEn || "Product"} - ${imgIndex + 1}`,
                                        createdAt: now,
                                        updatedAt: now,
                                    },
                                });
                            }
                        }
                    }

                    // Add product variants if available
                    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                        for (const variant of product.variants) {
                            // Skip invalid or incomplete variants
                            if (!variant.variantId || !variant.variantName) continue;

                            const variantCostPrice = parseFloat(variant.variantSellPrice || product.sellPrice);
                            const variantPrice = Math.ceil((variantCostPrice * markupMultiplier) * 100) / 100;
                            const variantComparePrice = Math.ceil((variantCostPrice * (markupMultiplier + 0.5)) * 100) / 100; // Consistent with main product (50% extra)

                            await tx.productVariant.create({
                                data: {
                                    productId: newProduct.id,
                                    name: variant.variantName,
                                    sku: variant.variantSku || `${newProduct.sku}-${variant.variantId}`,
                                    price: variantPrice,
                                    costPrice: variantCostPrice,
                                    compareAtPrice: variantComparePrice,
                                    inventory: 999, // Use dropshipping inventory
                                    type: variant.propertyName || "variant",
                                    options: variant.propertyList ? JSON.stringify(variant.propertyList) : null,
                                    image: variant.variantImage || product.productImage,
                                    createdAt: now,
                                    updatedAt: now,
                                },
                            });
                        }
                    }

                    return newProduct;
                });                    // Log action outside the transaction to avoid rollback if this fails
                await logAdminAction(
                    "product_imported",
                    `Admin imported product '${newProduct.name}' from CJ Dropshipping`,
                    session.user.id
                );

                importResults.push({
                    productId,
                    success: true,
                    productDbId: newProduct.id,
                    productName: newProduct.name
                });

            } catch (error: any) {
                console.error(`Error importing product ${productId}:`, error);
                importResults.push({
                    productId,
                    success: false,
                    error: error.message || String(error)
                });
            }
        }

        // Calculate success and failure counts
        const successCount = importResults.filter(result => result.success).length;
        const failCount = importResults.length - successCount;

        return NextResponse.json({
            success: true,
            message: `Imported ${successCount} products successfully, ${failCount} failed`,
            results: importResults
        });
    } catch (error: any) {
        console.error("Error in bulk import:", error);

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
                error: "Failed to import products",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
