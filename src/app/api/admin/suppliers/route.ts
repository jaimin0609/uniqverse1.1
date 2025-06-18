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
        }        // Get all suppliers with related product counts
        // Add timeout and retry logic for database connection issues
        const suppliers = await Promise.race([
            db.supplier.findMany({
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
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database timeout")), 10000)
            ),
        ]) as any;

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
            type: supplier.type || null,
            accessToken: supplier.accessToken ? "[HIDDEN]" : null, // Don't send actual tokens
            refreshToken: supplier.refreshToken ? "[HIDDEN]" : null, // Don't send actual tokens
            tokenExpiresAt: supplier.tokenExpiresAt || null,
            createdAt: supplier.createdAt,
            updatedAt: supplier.updatedAt,
            productsCount: supplier._count.products,
        }));

        // Log the admin action
        await logAdminAction(
            "suppliers_view",
            `Admin viewed suppliers list with ${suppliers.length} suppliers`,
            session.user.id
        );        // Cache suppliers for 15 minutes (suppliers data doesn't change frequently)
        const response = { suppliers: formattedSuppliers };
        await cache.set(cacheKey, response, 900);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching suppliers:", error);

        // Check if it's a database connection issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isDbConnectionError = errorMessage.includes("Database timeout") ||
            errorMessage.includes("socket closed") ||
            errorMessage.includes("prepared statement") ||
            errorMessage.includes("connection");

        if (isDbConnectionError) {
            console.error("Database connection issue detected");
            // Return cached data if available
            try {
                const cacheKey = `admin:suppliers:${hashObject({})}`;
                const cached = await cache.get(cacheKey);
                if (cached) {
                    console.log("Returning cached suppliers due to DB issues");
                    return NextResponse.json(cached);
                }
            } catch (cacheError) {
                console.error("Cache fallback failed:", cacheError);
            }

            return NextResponse.json(
                {
                    error: "Database connection issues. Please try again in a moment.",
                    details: "The database is experiencing connection problems. This is likely temporary.",
                    isTemporary: true
                },
                { status: 503 } // Service Unavailable
            );
        }

        return NextResponse.json(
            { error: "Failed to fetch suppliers", details: errorMessage },
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
        }        // Create new supplier
        const supplier = await Promise.race([
            db.supplier.create({
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
                    type: data.type || null,
                    accessToken: data.accessToken || null,
                    refreshToken: data.refreshToken || null,
                    tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
                },
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database timeout")), 10000)
            ),
        ]) as any;

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

        // Check if it's a database connection issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isDbConnectionError = errorMessage.includes("Database timeout") ||
            errorMessage.includes("socket closed") ||
            errorMessage.includes("prepared statement") ||
            errorMessage.includes("connection");

        if (isDbConnectionError) {
            return NextResponse.json(
                {
                    error: "Database connection issues. Please try again in a moment.",
                    details: "The database is experiencing connection problems. This is likely temporary.",
                    isTemporary: true
                },
                { status: 503 } // Service Unavailable
            );
        }

        return NextResponse.json(
            { error: "Failed to create supplier", details: errorMessage },
            { status: 500 }
        );
    }
}