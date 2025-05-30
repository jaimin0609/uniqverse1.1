import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-utils";
import { cache } from "@/lib/redis";
import { hashObject } from "@/lib/utils";

// GET all suppliers
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create cache key for suppliers list
        const cacheKey = `admin:suppliers:${hashObject({})}`;

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Get all suppliers with related product counts
        const suppliers = await db.supplier.findMany({
            orderBy: {
                name: "asc",
            },
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        // Format suppliers for response
        const formattedSuppliers = suppliers.map((supplier) => ({
            id: supplier.id,
            name: supplier.name,
            description: supplier.description,
            website: supplier.website,
            apiKey: supplier.apiKey ? "[HIDDEN]" : null, // Don't send actual API keys
            apiEndpoint: supplier.apiEndpoint,
            contactEmail: supplier.contactEmail,
            contactPhone: supplier.contactPhone,
            status: supplier.status,
            createdAt: supplier.createdAt,
            updatedAt: supplier.updatedAt,
            productsCount: supplier._count.products,
        }));

        // Log the admin action
        await logAdminAction(
            "suppliers_view",
            `Admin viewed suppliers list with ${suppliers.length} suppliers`,
            session.user.id
        );

        // Cache suppliers for 15 minutes (suppliers data doesn't change frequently)
        await cache.set(cacheKey, formattedSuppliers, 900);

        return NextResponse.json(formattedSuppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Failed to fetch suppliers", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// POST - Add a new supplier
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get data from request
        const data = await request.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json(
                { error: "Supplier name is required" },
                { status: 400 }
            );
        }

        // Create new supplier
        const supplier = await db.supplier.create({
            data: {
                name: data.name,
                description: data.description || null,
                website: data.website || null,
                apiKey: data.apiKey || null,
                apiEndpoint: data.apiEndpoint || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                averageShipping: data.averageShipping || null,
                status: data.status || "ACTIVE",
            },
        });

        // Log the admin action
        await logAdminAction(
            "supplier_create",
            `Admin created new supplier: ${supplier.name}`,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            supplier: {
                id: supplier.id,
                name: supplier.name
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Failed to create supplier", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}