import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { CJTokenStore } from "@/services/dropshipping/cj-token-store";

/**
 * Clear CJ Dropshipping cache and tokens
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { supplierId, clearAll } = body;

        const tokenStore = CJTokenStore.getInstance();

        if (clearAll) {
            await tokenStore.clearAllCache();
            return NextResponse.json({
                success: true,
                message: "All CJ Dropshipping cache cleared successfully"
            });
        } else if (supplierId) {
            await tokenStore.clearSupplierTokens(supplierId);
            return NextResponse.json({
                success: true,
                message: `Cache cleared for supplier: ${supplierId}`
            });
        } else {
            return NextResponse.json({
                error: "Please specify either clearAll: true or provide a supplierId"
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error clearing CJ cache:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to clear cache",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
