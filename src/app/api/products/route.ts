import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/redis";
import { performanceMonitor, withCacheHitDetection } from "@/lib/performance-monitor";
import { z } from "zod";

// Schema for product creation and updates
const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    compareAtPrice: z.number().optional().nullable(),
    costPrice: z.number().optional().nullable(),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    inventory: z.number().int().nonnegative().default(0),
    weight: z.number().optional().nullable(),
    dimensions: z.string().optional().nullable(),
    categoryId: z.string().min(1, "Category is required"),
    tags: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    featuredOrder: z.number().int().optional().nullable(),
    images: z.array(
        z.object({
            url: z.string().url("Invalid image URL"),
            alt: z.string().optional(),
            position: z.number().int().nonnegative().default(0)
        })
    ).optional(),
    lowStockThreshold: z.number().int().nonnegative().default(10)
});

// GET - Retrieve products with filtering, pagination, and sorting
export async function GET(req: NextRequest) {
    const timer = performanceMonitor.startTimer('/api/products', 'GET', req);

    try {
        const url = new URL(req.url);

        // Pagination parameters
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "12"), 50); // Cap at 50 for performance
        const skip = (page - 1) * limit;

        // Filter parameters
        const category = url.searchParams.get("category");
        const minPrice = url.searchParams.get("minPrice") ?
            parseFloat(url.searchParams.get("minPrice") as string) : undefined;
        const maxPrice = url.searchParams.get("maxPrice") ?
            parseFloat(url.searchParams.get("maxPrice") as string) : undefined;
        const search = url.searchParams.get("search");
        const featured = url.searchParams.get("featured") === "true" ? true : undefined;

        // Sorting parameters
        const sortField = url.searchParams.get("sortField") || "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") || "desc";

        // Generate cache key for this specific query
        const queryParams = {
            page, limit, category, minPrice, maxPrice, search, featured, sortField, sortOrder
        };
        const cacheKey = cacheKeys.products(JSON.stringify(queryParams));

        // Try to get from cache first
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            const response = NextResponse.json(cachedResult);
            const responseWithHeader = withCacheHitDetection(response, true);
            return timer.end(responseWithHeader, true);
        }

        // Build optimized filter conditions
        const where: any = {
            isPublished: true // Only show published products by default
        };

        if (category) {
            where.category = {
                slug: category
            };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (featured !== undefined) {
            where.isFeatured = featured;
        }

        // Optimize the query by reducing included data
        const [products, total] = await Promise.all([
            db.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    compareAtPrice: true,
                    isPublished: true,
                    isFeatured: true,
                    createdAt: true,
                    images: {
                        select: {
                            url: true,
                            alt: true,
                            position: true
                        },
                        orderBy: { position: 'asc' },
                        take: 3 // Only get first 3 images for performance
                    },
                    category: {
                        select: { name: true, slug: true }
                    },
                    // Only get essential variant info
                    variants: {
                        select: {
                            id: true,
                            name: true,
                            price: true
                        },
                        take: 1 // Only get first variant for list view
                    },
                    // Get review stats efficiently
                    _count: {
                        select: {
                            reviews: {
                                where: { status: 'APPROVED' }
                            }
                        }
                    },
                    // Get average rating efficiently
                    reviews: {
                        where: { status: 'APPROVED' },
                        select: { rating: true }
                    }
                },
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder }
            }),
            db.product.count({ where })
        ]);

        // Calculate average rating for each product efficiently
        const productsWithStats = products.map(product => {
            const avgRating = product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0; return {
                    ...product,
                    averageRating: Math.round(avgRating * 10) / 10,
                    reviewCount: product._count.reviews,
                    reviews: undefined, // Remove the reviews array from the response
                    _count: undefined // Remove the _count object
                };
        });

        const result = {
            products: productsWithStats,
            pagination: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit)
            },
            cache: {
                generated: new Date().toISOString(),
                ttl: 600 // 10 minutes
            }
        };

        // Cache the result for 10 minutes with shorter TTL for better freshness
        await cache.set(cacheKey, result, 600);

        const response = NextResponse.json(result);
        const responseWithHeader = withCacheHitDetection(response, false);
        return timer.end(responseWithHeader, false);

    } catch (error) {
        console.error("Error fetching products:", error);
        const errorResponse = NextResponse.json(
            { message: "Failed to fetch products" },
            { status: 500 }
        );
        return timer.end(errorResponse, false);
    }
}

// POST - Create a new product (admin only)
export async function POST(req: Request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json();

        // Validate input
        const validationResult = productSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid product data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const productData = validationResult.data;

        // Generate slug from product name
        const slug = productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check if slug already exists
        const existingProduct = await db.product.findUnique({
            where: { slug }
        });

        if (existingProduct) {
            return NextResponse.json(
                { message: "A product with this name already exists" },
                { status: 400 }
            );
        }

        // Extract images to handle separately
        const { images, ...rest } = productData;

        // Create product
        const product = await db.product.create({
            data: {
                ...rest,
                slug,
                updatedAt: new Date(),
                // Create images if provided
                images: images ? {
                    create: images.map(image => ({
                        ...image,
                        updatedAt: new Date(),
                        createdAt: new Date()
                    }))
                } : undefined
            },
            include: {
                images: true,
                category: true
            }
        });

        return NextResponse.json({
            message: "Product created successfully",
            product
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { message: "Failed to create product" },
            { status: 500 }
        );
    }
}

// PATCH - Update an existing product
export async function PATCH(req: Request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json(
                { message: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product exists
        const existingProduct = await db.product.findUnique({
            where: { id: body.id },
            include: { images: true }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        // Validate input (partial validation for update)
        const updateSchema = productSchema.partial();
        const validationResult = updateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid product data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { images, id, ...updateData } = body;

        // Update slug if name is changing
        if (updateData.name && updateData.name !== existingProduct.name) {
            updateData.slug = updateData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            // Check if new slug already exists
            const slugExists = await db.product.findUnique({
                where: {
                    slug: updateData.slug,
                    NOT: { id }
                }
            });

            if (slugExists) {
                return NextResponse.json(
                    { message: "A product with this name already exists" },
                    { status: 400 }
                );
            }
        }

        // Update product
        const updatedProduct = await db.product.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date()
            },
            include: {
                images: true,
                category: true
            }
        });

        // Handle images update if provided
        if (images) {
            // Delete existing images
            await db.productImage.deleteMany({
                where: { productId: id }
            });

            // Create new images
            if (images.length > 0) {
                await db.productImage.createMany({
                    data: images.map((image: any, index: number) => ({
                        url: image.url,
                        alt: image.alt || updatedProduct.name,
                        position: image.position || index,
                        productId: id,
                        updatedAt: new Date()
                    }))
                });
            }

            // Fetch updated product with new images
            const productWithImages = await db.product.findUnique({
                where: { id },
                include: {
                    images: {
                        orderBy: { position: 'asc' }
                    },
                    category: true
                }
            });

            return NextResponse.json({
                message: "Product updated successfully",
                product: productWithImages
            });
        }

        return NextResponse.json({
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { message: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a product
export async function DELETE(req: Request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product exists
        const existingProduct = await db.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        // Delete product (Prisma cascade will handle related records)
        await db.product.delete({
            where: { id }
        });

        return NextResponse.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { message: "Failed to delete product" },
            { status: 500 }
        );
    }
}