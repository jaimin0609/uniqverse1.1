import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { z } from "zod";
import { cacheInvalidation } from "@/lib/redis";

// Validation schema for customer updates
const customerUpdateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).optional(),
    isActive: z.boolean().optional(),
});

// Get a specific customer with their orders and addresses
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customerId = resolvedParams.id;

        // Fetch customer with all their orders and addresses
        const customer = await db.user.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        createdAt: true,
                        paymentStatus: true,
                        fulfillmentStatus: true,
                    }
                },
                addresses: {
                    orderBy: {
                        isDefault: "desc"
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Log this admin action
        await logAdminAction(
            "customer_view",
            `Admin viewed customer ${customer.name || customer.email} (ID: ${customer.id})`,
            session.user.id
        );

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Failed to fetch customer" },
            { status: 500 }
        );
    }
}

// Update a customer
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customerId = resolvedParams.id;
        const data = await request.json();

        // Validate update data
        const validatedData = customerUpdateSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if customer exists
        const existingCustomer = await db.user.findUnique({
            where: { id: customerId },
            select: {
                name: true,
                email: true,
                role: true
            }
        });

        if (!existingCustomer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Record what's being changed for the audit log
        let changeDetails: string[] = [];

        if (data.name && data.name !== existingCustomer.name) {
            changeDetails.push(`name from "${existingCustomer.name || ''}" to "${data.name}"`);
        }

        if (data.email && data.email !== existingCustomer.email) {
            changeDetails.push(`email from "${existingCustomer.email}" to "${data.email}"`);
        }

        if (data.role && data.role !== existingCustomer.role) {
            changeDetails.push(`role from "${existingCustomer.role}" to "${data.role}"`);
        }

        // Update the customer
        const updatedCustomer = await db.user.update({
            where: { id: customerId },
            data: validatedData.data,
            include: {
                orders: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        createdAt: true,
                        paymentStatus: true,
                        fulfillmentStatus: true,
                    }
                },
                addresses: {
                    orderBy: {
                        isDefault: "desc"
                    }
                }
            }
        });        // Log this admin action
        await logAdminAction(
            "customer_update",
            `Admin updated customer ${existingCustomer.name || existingCustomer.email}: ${changeDetails.join(", ")}`,
            session.user.id
        );

        // Invalidate customers cache
        await cacheInvalidation.onAdminCustomersChange();

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

// Delete a customer
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customerId = resolvedParams.id;

        // Check if customer exists
        const existingCustomer = await db.user.findUnique({
            where: { id: customerId },
            select: {
                name: true,
                email: true,
                role: true
            }
        });

        if (!existingCustomer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Special safeguard: prevent admin from deleting themselves
        if (customerId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Delete all related data in the correct order
        // 1. First, delete all associated addresses
        await db.address.deleteMany({
            where: { userId: customerId }
        });

        // 2. Remove from wishlists (many-to-many relationships with products)
        const userWithWishlist = await db.user.findUnique({
            where: { id: customerId },
            include: { Product: true }
        });

        if (userWithWishlist && userWithWishlist.Product.length > 0) {
            await db.user.update({
                where: { id: customerId },
                data: {
                    Product: {
                        set: [] // Clear the wishlist
                    }
                }
            });
        }

        // 3. Find user's cart and delete cart items
        const userCart = await db.cart.findUnique({
            where: { userId: customerId }
        });

        if (userCart) {
            // Delete all cart items first
            await db.cartItem.deleteMany({
                where: { cartId: userCart.id }
            });

            // Then delete the cart itself
            await db.cart.delete({
                where: { id: userCart.id }
            });
        }

        // 4. Delete user's reviews
        await db.review.deleteMany({
            where: { userId: customerId }
        });

        // 5. For orders - first store customer information before disconnecting
        const customerName = existingCustomer.name || "Anonymous";
        const customerEmail = existingCustomer.email;

        // Get all orders for this user
        const userOrders = await db.order.findMany({
            where: { userId: customerId },
            select: { id: true }
        });

        // Update each order individually to store customer info and disconnect the user
        for (const order of userOrders) {
            await db.order.update({
                where: { id: order.id },
                data: {
                    // Store notes about the customer before disconnecting
                    notes: `Order was originally for: ${customerName} (${customerEmail}) - Account deleted`,

                    // Remove the association with the user - using proper disconnect syntax
                    userId: ""  // Setting to empty string first to break the connection
                }
            });
        }

        // 6. Finally delete the user
        await db.user.delete({
            where: { id: customerId }
        });        // Log this admin action
        await logAdminAction(
            "customer_delete",
            `Admin deleted customer ${existingCustomer.name || existingCustomer.email} (ID: ${customerId})`,
            session.user.id
        );

        // Invalidate customers cache
        await cacheInvalidation.onAdminCustomersChange();

        return NextResponse.json(
            { message: "Customer deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Failed to delete customer", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}