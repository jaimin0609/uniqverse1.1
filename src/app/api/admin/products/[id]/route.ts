import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin-utils";

// Product validation schema
const productUpdateSchema = z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    slug: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be a positive number"),
    compareAtPrice: z.number().nullable().optional(),
    inventory: z.number().int().min(0, "Inventory must be a non-negative integer"),
    images: z.array(z.string()).min(1, "At least one product image is required"),
    categoryId: z.string().min(1, "Category is required"),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    variants: z.record(z.array(z.string())).optional(),
});

// Get a specific product
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id; const product = await db.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                variants: true,
                images: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5,  // Just get the 5 most recent reviews
                },
            },
        });

        // Log product details for debugging
        console.log('Product description from DB:', product?.description?.substring(0, 50) + '...');
        console.log('Product variantTypes:', product?.variantTypes);

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Log this admin action
        await logAdminAction(
            "product_view",
            `Admin viewed product "${product.name}" (ID: ${product.id})`,
            session.user.id
        );

        // Transform images to array of URLs for frontend compatibility
        const transformedProduct = {
            ...product,
            images: product.images.map(img => img.url),
        };

        return NextResponse.json(transformedProduct);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// Update a product
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id;
        const data = await request.json();

        console.log("Updating product data:", data);

        // Validate product data
        const validatedData = productUpdateSchema.safeParse(data);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if product exists
        const existingProduct = await db.product.findUnique({
            where: { id: productId },
            include: {
                images: true,
            },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check slug uniqueness if changed
        if (validatedData.data.slug && validatedData.data.slug !== existingProduct.slug) {
            const slugExists = await db.product.findFirst({
                where: {
                    slug: validatedData.data.slug,
                    id: { not: productId },
                },
            });

            if (slugExists) {
                // Append a random string to make the slug unique
                const randomString = Math.random().toString(36).substring(2, 8);
                validatedData.data.slug = `${validatedData.data.slug}-${randomString}`;
            }
        }

        // Update product basic info
        const updatedProduct = await db.product.update({
            where: { id: productId },
            data: {
                name: validatedData.data.name,
                slug: validatedData.data.slug,
                description: validatedData.data.description,
                price: validatedData.data.price,
                compareAtPrice: validatedData.data.compareAtPrice,
                inventory: validatedData.data.inventory,
                isPublished: validatedData.data.isPublished,
                isFeatured: validatedData.data.isFeatured,
                category: {
                    connect: { id: validatedData.data.categoryId },
                },
            },
            include: {
                category: true,
            },
        });

        // Handle image updates
        // First, delete all existing images
        await db.productImage.deleteMany({
            where: { productId: productId },
        });

        // Then create new images
        const imagePromises = validatedData.data.images.map((url, index) =>
            db.productImage.create({
                data: {
                    url,
                    alt: `${validatedData.data.name} image ${index + 1}`,
                    position: index,
                    productId: productId,
                    updatedAt: new Date(),
                },
            })
        );
        await Promise.all(imagePromises);        // Handle variants update if provided
        if (validatedData.data.variants && Object.keys(validatedData.data.variants).length > 0) {
            // First remove all existing variants
            await db.productVariant.deleteMany({
                where: { productId },
            });

            // Store the variant structure in the product
            await db.product.update({
                where: { id: productId },
                data: {
                    variantTypes: JSON.stringify(validatedData.data.variants)
                }
            });

            // Then create new variants
            const variants = validatedData.data.variants;

            for (const [variantType, options] of Object.entries(variants)) {
                if (Array.isArray(options)) {
                    for (const option of options) {
                        await db.productVariant.create({
                            data: {
                                name: option,
                                type: variantType, // Store the variant type in the type field
                                options: JSON.stringify({ [variantType]: option }), // Store structured options
                                price: validatedData.data.price, // Default to same price as product
                                inventory: Math.floor(validatedData.data.inventory / options.length), // Distribute inventory
                                productId: productId,
                                updatedAt: new Date(),
                            },
                        });
                    }
                }
            }
        }

        // Create inventory history record if inventory changed
        if (existingProduct.inventory !== validatedData.data.inventory) {
            await db.inventoryHistory.create({
                data: {
                    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique ID
                    productId,
                    previousValue: existingProduct.inventory,
                    newValue: validatedData.data.inventory,
                    action: "ADMIN_UPDATE",
                    userId: session.user.id,
                },
            });
        }

        // Log this admin action
        await logAdminAction(
            "product_update",
            `Admin updated product "${validatedData.data.name}" (ID: ${productId})`,
            session.user.id
        );

        // Return updated product with variants and images in the expected format
        const finalProduct = await db.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                variants: true,
                images: {
                    orderBy: {
                        position: 'asc',
                    },
                },
            },
        });

        // Transform the data to match expected format
        const transformedProduct = {
            ...finalProduct,
            images: finalProduct?.images.map(img => img.url) || [],
        };

        return NextResponse.json(transformedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// Delete a product
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id;

        // Check if product exists
        const existingProduct = await db.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Delete all related data in the correct order
        // 1. Delete product variants first (due to foreign key constraints)
        await db.productVariant.deleteMany({
            where: { productId },
        });

        // 2. Delete product images
        await db.productImage.deleteMany({
            where: { productId },
        });

        // 3. Delete product reviews
        await db.review.deleteMany({
            where: { productId },
        });

        // 4. Delete inventory history
        await db.inventoryHistory.deleteMany({
            where: { productId },
        });

        // 5. Delete product from cart items
        await db.cartItem.deleteMany({
            where: { productId },
        });

        // 6. Remove product from user wishlists (many-to-many relation)
        // We need to find users who have this product in their wishlist
        const usersWithThisProductInWishlist = await db.user.findMany({
            where: {
                Product: {
                    some: {
                        id: productId
                    }
                }
            },
        });

        // Disconnect the product from each user's wishlist
        for (const user of usersWithThisProductInWishlist) {
            await db.user.update({
                where: { id: user.id },
                data: {
                    Product: {
                        disconnect: { id: productId }
                    }
                }
            });
        } try {
            // Try to fully delete the product first
            await db.product.delete({
                where: { id: productId },
            });

            // Log this admin action if successful
            await logAdminAction(
                "product_delete",
                `Admin deleted product "${existingProduct.name}" (ID: ${productId})`,
                session.user.id
            );
        } catch (deleteError) {
            console.log("Could not hard delete product, using soft delete instead:", deleteError);

            // If full deletion fails due to foreign key constraints, use soft delete
            await db.product.update({
                where: { id: productId },
                data: {
                    isDeleted: true,
                    isPublished: false,
                    isFeatured: false,
                }
            });

            // Log the soft delete action
            await logAdminAction(
                "product_soft_delete",
                `Admin soft-deleted product "${existingProduct.name}" (ID: ${productId})`,
                session.user.id
            );
        }

        return NextResponse.json(
            { message: "Product deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}