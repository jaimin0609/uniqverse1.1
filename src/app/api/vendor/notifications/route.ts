import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET vendor notification preferences
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // For now, return default preferences
        // In a production app, you would store these in a database
        const notifications = {
            orderNotifications: true,
            lowStockAlerts: true,
            paymentNotifications: true,
            marketingEmails: false,
            weeklyReports: true,
        };

        return NextResponse.json({ notifications });

    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification preferences" },
            { status: 500 }
        );
    }
}

// PUT update vendor notification preferences
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // In a production app, you would save these to a database
        // For now, we'll just return success

        return NextResponse.json({
            success: true,
            message: "Notification preferences updated"
        });

    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to update notification preferences" },
            { status: 500 }
        );
    }
}
