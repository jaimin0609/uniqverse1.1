import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin-utils";
import { cacheInvalidation } from "@/lib/redis";

// Bulk delete validation schema
const bulkDeleteSchema = z.object({
    productIds: z.array(z.string()).min(1, "At least one product ID is required"),
});

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productIds } = bulkDeleteSchema.parse(body);

        // Check if all products exist
        const existingProducts = await db.product.findMany({
            where: {
                id: { in: productIds },
                isDeleted: { not: true } // Only include non-deleted products
            },
            select: { id: true, name: true }
        });

        if (existingProducts.length === 0) {
            return NextResponse.json(
                { error: "No valid products found to delete" },
                { status: 404 }
            );
        }

        const existingProductIds = existingProducts.map(p => p.id);
        const invalidProductIds = productIds.filter(id => !existingProductIds.includes(id));

        let deletedCount = 0;
        let failedDeletes: string[] = [];

        // Process each product deletion
        for (const productId of existingProductIds) {
            try {
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
                }

                // 7. Finally delete the product
                try {
                    await db.product.delete({
                        where: { id: productId },
                    });
                } catch (deleteError) {
                    console.log(`Could not hard delete product ${productId}, using soft delete instead:`, deleteError);

                    // If full deletion fails due to foreign key constraints, use soft delete
                    await db.product.update({
                        where: { id: productId },
                        data: {
                            isDeleted: true,
                            isPublished: false,
                            isFeatured: false,
                        }
                    });
                }

                // Invalidate cache for this product
                await cacheInvalidation.onProductChange(productId);

                deletedCount++;
            } catch (error) {
                console.error(`Error deleting product ${productId}:`, error);
                failedDeletes.push(productId);
            }
        }

        // Log this admin action
        const productNames = existingProducts
            .filter(p => !failedDeletes.includes(p.id))
            .map(p => p.name)
            .join(", ");

        if (deletedCount > 0) {
            await logAdminAction(
                "products_bulk_delete",
                `Admin bulk deleted ${deletedCount} products: ${productNames}`,
                session.user.id
            );
        }

        // Prepare response
        const response: any = {
            message: `Successfully deleted ${deletedCount} product(s)`,
            deletedCount,
            totalRequested: productIds.length,
        };

        if (invalidProductIds.length > 0) {
            response.invalidIds = invalidProductIds;
            response.warning = `${invalidProductIds.length} product(s) were not found or already deleted`;
        }

        if (failedDeletes.length > 0) {
            response.failedDeletes = failedDeletes;
            response.error = `${failedDeletes.length} product(s) failed to delete`;
        }

        const statusCode = failedDeletes.length > 0 ? 207 : 200; // 207 Multi-Status for partial success
        return NextResponse.json(response, { status: statusCode });

    } catch (error) {
        console.error("Error in bulk delete:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to bulk delete products" },
            { status: 500 }
        );
    }
}
