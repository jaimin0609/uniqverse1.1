import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";

// GET a single supplier
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fix: Use params directly as a string
        const supplierId = String(params.id);

        // Get supplier details
        const supplier = await db.supplier.findUnique({
            where: { id: supplierId },
            include: {
                _count: {
                    select: {
                        products: true,
                        SupplierOrder: true,
                    },
                },
                products: {
                    take: 5,
                    select: {
                        id: true,
                        name: true,
                        inventory: true,
                    },
                },
                SupplierOrder: {
                    take: 5,
                    orderBy: {
                        createdAt: "desc",
                    },
                    select: {
                        id: true,
                        status: true,
                        orderDate: true,
                        totalCost: true,
                        _count: {
                            select: {
                                OrderItem: true,
                            },
                        },
                    },
                },
            },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Log the admin action
        await logAdminAction(
            "supplier_view",
            `Admin viewed supplier details: ${supplier.name}`,
            session.user.id
        );

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error fetching supplier details:", error);
        return NextResponse.json(
            { error: "Failed to fetch supplier details", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// PUT - Update a supplier
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierId = params.id;
        const data = await request.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json(
                { error: "Supplier name is required" },
                { status: 400 }
            );
        }

        // Get existing supplier to log changes
        const existingSupplier = await db.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!existingSupplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Update supplier
        const updatedSupplier = await db.supplier.update({
            where: { id: supplierId },
            data: {
                name: data.name,
                description: data.description || null,
                website: data.website || null,
                apiKey: data.apiKey || null,
                apiEndpoint: data.apiEndpoint || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                averageShipping: data.averageShipping || null,
                status: data.status || existingSupplier.status,
            },
        });

        // Log the admin action with details of what changed
        const changes: string[] = [];
        if (existingSupplier.name !== updatedSupplier.name) {
            changes.push(`name changed to ${updatedSupplier.name}`);
        }
        if (existingSupplier.status !== updatedSupplier.status) {
            changes.push(`status changed to ${updatedSupplier.status}`);
        }
        if ((!existingSupplier.apiKey && updatedSupplier.apiKey) ||
            (existingSupplier.apiKey && !updatedSupplier.apiKey)) {
            changes.push("API authentication changed");
        }

        // Update to match logAdminAction parameter signature
        await logAdminAction(
            "supplier_update",
            `Admin updated supplier: ${updatedSupplier.name}${changes.length ? ` (${changes.join(", ")})` : ""}`,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            supplier: {
                id: updatedSupplier.id,
                name: updatedSupplier.name
            }
        });
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json(
            { error: "Failed to update supplier", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// PATCH - Update supplier status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierId = params.id;
        const data = await request.json();

        // Validate data
        if (!data.status || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(data.status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Get existing supplier to log changes
        const existingSupplier = await db.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!existingSupplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Update supplier status
        const updatedSupplier = await db.supplier.update({
            where: { id: supplierId },
            data: {
                status: data.status,
            },
        });

        // Log the admin action with metadata
        await logAdminAction(
            "supplier_status_update",
            `Admin changed supplier ${updatedSupplier.name} status to ${data.status} (from ${existingSupplier.status})`,
            session.user.id
        );

        return NextResponse.json({ success: true, status: data.status });
    } catch (error) {
        console.error("Error updating supplier status:", error);
        return NextResponse.json(
            { error: "Failed to update supplier status", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// DELETE - Delete a supplier
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supplierId = params.id;

        // Get existing supplier for logging
        const existingSupplier = await db.supplier.findUnique({
            where: { id: supplierId },
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!existingSupplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Handle products associated with this supplier
        // Update products to remove supplier association but keep the data
        await db.product.updateMany({
            where: { supplierId },
            data: {
                supplierId: null,
                // Keep supplier information in these fields
                supplierSource: existingSupplier.name,
            },
        });

        // Delete supplier
        await db.supplier.delete({
            where: { id: supplierId },
        });

        // Log the admin action
        await logAdminAction(
            "supplier_delete",
            `Admin deleted supplier: ${existingSupplier.name} (${existingSupplier._count.products} products affected)`,
            session.user.id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
            { error: "Failed to delete supplier", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}