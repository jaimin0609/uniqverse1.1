import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { createSupplierApiClient } from "@/services/dropshipping/supplier-api-client";
import { db } from "@/lib/db";

/**
 * Check CJ Dropshipping API status and rate limits
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get supplier ID from query
        const searchParams = request.nextUrl.searchParams;
        const supplierId = searchParams.get('supplierId');

        // Make sure supplier ID is provided
        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
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

        // Create the CJ Dropshipping client
        const client = createSupplierApiClient({
            supplierId: supplier.id,
            apiKey: supplier.apiKey,
            apiEndpoint: supplier.apiEndpoint,
        }) as any; // Use 'any' to access custom methods

        // Check if we can make requests
        const status = await client.canMakeRequest();
        const authWaitTime = await client.getTimeUntilNextAuthAllowed();

        return NextResponse.json({
            success: true,
            canMakeRequest: status.canProceed,
            waitTime: status.waitTime,
            reason: status.reason,
            authWaitTime,
            status: status.canProceed ? 'ready' : 'rate_limited',
            supplier: {
                id: supplier.id,
                name: supplier.name
            }
        });

    } catch (error: any) {
        console.error("Error checking CJ Dropshipping status:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to check API status",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
