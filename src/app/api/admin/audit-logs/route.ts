import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminAuditLogs } from "@/lib/admin-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        // Check if user is authenticated and has admin role
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get pagination parameters from query
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

        // Get audit logs with pagination
        const auditLogs = await getAdminAuditLogs(page, pageSize);

        return NextResponse.json(auditLogs);
    } catch (error) {
        console.error("Error fetching admin audit logs:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}