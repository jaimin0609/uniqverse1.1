import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET single vendor product
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const productId = params.id;

        const product = await db.product.findFirst({
            where: {
                id: productId,
                vendorId: vendorId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                images: {
                    orderBy: { position: 'asc' }
                },
                variants: true,
                _count: {
                    select: {
                        OrderItem: true,
                        reviews: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });

    } catch (error) {
        console.error("Error fetching vendor product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// PUT update vendor product
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const productId = params.id;
        const data = await request.json();

        // Verify product belongs to vendor
        const existingProduct = await db.product.findFirst({
            where: {
                id: productId,
                vendorId: vendorId
            }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Update product
        const updatedProduct = await db.product.update({
            where: { id: productId },
            data: {
                name: data.name,
                slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                description: data.description || "",
                price: parseFloat(data.price),
                compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
                costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
                inventory: parseInt(data.inventory) || 0,
                sku: data.sku || null,
                barcode: data.barcode || null,
                weight: data.weight ? parseFloat(data.weight) : null,
                dimensions: data.dimensions || null,
                brand: data.brand || null,
                tags: data.tags || null,
                isPublished: data.isPublished || false,
                lowStockThreshold: parseInt(data.lowStockThreshold) || 10,
                categoryId: data.categoryId,
            }
        });

        // Handle image updates
        if (data.existingImages || data.newImages) {
            // First, get all current images
            const currentImages = await db.productImage.findMany({
                where: { productId: productId }
            });

            const existingImageIds = data.existingImages || [];

            // Delete images that are no longer in the existing list
            const imagesToDelete = currentImages.filter(img => !existingImageIds.includes(img.id));
            if (imagesToDelete.length > 0) {
                await db.productImage.deleteMany({
                    where: {
                        id: { in: imagesToDelete.map(img => img.id) }
                    }
                });
            }

            // Add new images
            if (data.newImages && data.newImages.length > 0) {
                const maxPosition = currentImages.length > 0
                    ? Math.max(...currentImages.map(img => img.position))
                    : -1;

                await db.productImage.createMany({
                    data: data.newImages.map((imageUrl: string, index: number) => ({
                        url: imageUrl,
                        alt: data.name,
                        position: maxPosition + 1 + index,
                        productId: productId,
                    })),
                });
            }
        }

        // Fetch updated product with relations
        const completeProduct = await db.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                images: {
                    orderBy: { position: 'asc' }
                },
                variants: true
            }
        });

        return NextResponse.json({
            success: true,
            product: completeProduct
        });

    } catch (error) {
        console.error("Error updating vendor product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE vendor product
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const productId = params.id;

        // Verify product belongs to vendor
        const existingProduct = await db.product.findFirst({
            where: {
                id: productId,
                vendorId: vendorId
            }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if product has orders
        const hasOrders = await db.orderItem.findFirst({
            where: { productId: productId }
        });

        if (hasOrders) {
            // Soft delete - mark as deleted instead of removing
            await db.product.update({
                where: { id: productId },
                data: {
                    isDeleted: true,
                    isPublished: false
                }
            });
        } else {
            // Hard delete if no orders exist
            await db.product.delete({
                where: { id: productId }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting vendor product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
