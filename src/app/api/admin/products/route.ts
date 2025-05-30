import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin-utils";
import { cache, cacheInvalidation } from "@/lib/redis";
import { hashObject } from "@/lib/utils";

// Product validation schema
const productSchema = z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be a positive number"),
    compareAtPrice: z.number().nullable().optional(),
    inventory: z.number().int().min(0, "Inventory must be a non-negative integer"),
    images: z.array(z.string()).min(1, "At least one product image is required"),
    categoryId: z.string().min(1, "Category is required"),
    isPublished: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    variants: z.record(z.array(z.string())).optional(),
});

// Get all products (with pagination, sorting, and filtering)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const sortBy = url.searchParams.get("sortBy") || "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") || "desc";
        const showLowStock = url.searchParams.get("lowStock") === "true"; const showOutOfStock = url.searchParams.get("outOfStock") === "true";
        const skipItems = (page - 1) * limit;

        // Create cache key based on query parameters
        const queryParams = { page, limit, search, category, sortBy, sortOrder, showLowStock, showOutOfStock };
        const cacheKey = `admin:products:${hashObject(queryParams)}`;

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build filter conditions
        const where: any = {
            // By default, don't show deleted products unless explicitly requested
            isDeleted: false
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            where.categoryId = category;
        }

        if (showLowStock) {
            where.inventory = {
                lte: db.product.fields.lowStockThreshold,
                gt: 0
            };
        }

        if (showOutOfStock) {
            where.inventory = {
                equals: 0
            };
        }

        // Count total products
        const totalProducts = await db.product.count({ where });

        // Fetch products with pagination and sorting
        const products = await db.product.findMany({
            where,
            include: {
                images: {
                    orderBy: { position: 'asc' }
                },
                category: {
                    select: { name: true, slug: true }
                },
                variants: true,
                _count: {
                    select: { reviews: true }
                }
            },
            orderBy: { [sortBy]: sortOrder },
            skip: skipItems,
            take: limit
        });        // Transform the data for the frontend
        const formattedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            inventory: product.inventory,
            lowStockThreshold: product.lowStockThreshold,
            // Convert images to array of image URLs as expected by the frontend
            images: product.images.map(img => img.url),
            category: {
                name: product.category?.name || "Uncategorized",
                slug: product.category?.slug || ""
            },
            isPublished: product.isPublished,
            isFeatured: product.isFeatured,
            hasVariants: product.variants.length > 0,
            numReviews: product._count.reviews
        }));        // Log the admin action
        await logAdminAction(
            "product_list_view",
            `Admin viewed product list with filters: search=${search}, category=${category}, page=${page}`,
            session.user.id
        );

        const response = {
            products: formattedProducts,
            pagination: {
                page,
                limit,
                totalItems: totalProducts,
                totalPages: Math.ceil(totalProducts / limit)
            }
        };

        // Cache admin products for 5 minutes (product data changes moderately)
        await cache.set(cacheKey, response, 300);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// Create a new product
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        console.log("Creating product with data:", data);

        // Validate product data
        const validatedData = productSchema.safeParse(data);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = validatedData.data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check if slug is unique
        const slugExists = await db.product.findUnique({
            where: { slug },
        });

        // If slug already exists, make it unique
        const finalSlug = slugExists
            ? `${slug}-${Date.now().toString().slice(-6)}`
            : slug;

        // Create the product
        const product = await db.product.create({
            data: {
                name: validatedData.data.name,
                slug: finalSlug,
                description: validatedData.data.description,
                price: validatedData.data.price,
                compareAtPrice: validatedData.data.compareAtPrice,
                inventory: validatedData.data.inventory,
                isPublished: validatedData.data.isPublished,
                isFeatured: validatedData.data.isFeatured,
                categoryId: validatedData.data.categoryId,
            },
        });

        // Create product images
        if (validatedData.data.images && validatedData.data.images.length > 0) {
            await db.productImage.createMany({
                data: validatedData.data.images.map((url, index) => ({
                    url,
                    alt: `${validatedData.data.name} image ${index + 1}`,
                    position: index,
                    productId: product.id,
                    updatedAt: new Date(),
                })),
            });
        }

        // Process variants if provided
        if (validatedData.data.variants && Object.keys(validatedData.data.variants).length > 0) {
            const variants = validatedData.data.variants;

            for (const [variantType, options] of Object.entries(variants)) {
                if (Array.isArray(options)) {
                    for (const option of options) {
                        await db.productVariant.create({
                            data: {
                                name: option,
                                options: variantType, // Store the variant type in the options field
                                price: validatedData.data.price, // Default to same price as product
                                inventory: Math.floor(validatedData.data.inventory / options.length), // Distribute inventory
                                productId: product.id,
                                updatedAt: new Date(),
                            },
                        });
                    }
                }
            }
        }

        // Create inventory history record for initial stock
        await db.inventoryHistory.create({
            data: {
                id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                productId: product.id,
                previousValue: 0,
                newValue: validatedData.data.inventory,
                action: "PRODUCT_CREATED",
                userId: session.user.id,
            },
        });

        // Log the admin action
        await logAdminAction(
            "product_create",
            `Admin created new product "${validatedData.data.name}" (ID: ${product.id})`,
            session.user.id
        );

        // Invalidate relevant caches
        await cacheInvalidation.onProductChange(product.id);

        // Return the created product with its images in the right format
        const createdProduct = await db.product.findUnique({
            where: { id: product.id },
            include: {
                images: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                variants: true,
                category: true,
            },
        });

        // Transform to the expected format
        const transformedProduct = {
            ...createdProduct,
            images: createdProduct?.images.map(img => img.url) || [],
        };

        return NextResponse.json(transformedProduct, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}