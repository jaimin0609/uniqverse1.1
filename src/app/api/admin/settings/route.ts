import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Return default settings for now
        // In a real app, you'd fetch these from database
        const settings = {
            siteName: "UniQverse",
            siteDescription: "Your Ultimate E-commerce Destination",
            supportEmail: "support@uniqverse.com",
            maintenanceMode: false,
            allowRegistration: true,
            emailNotifications: true,
            autoBackup: true,
            cacheEnabled: true,
        };

        return NextResponse.json(settings);

    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await req.json();

        // In a real app, you'd save these to database
        console.log("Settings updated:", settings);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
