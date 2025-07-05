import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const commissionSettingsSchema = z.object({
    defaultCommissionRate: z.number().min(0).max(1),
    tieredRates: z.array(z.object({
        threshold: z.number().min(0),
        rate: z.number().min(0).max(1)
    })).optional(),
    minimumPayout: z.number().min(0),
    paymentMethod: z.string(),
    paymentDetails: z.any().optional()
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== "VENDOR") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const settings = await db.vendorCommissionSettings.findUnique({
            where: { vendorId: session.user.id }
        });

        return NextResponse.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error("Error fetching commission settings:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch commission settings",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== "VENDOR") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validationResult = commissionSettingsSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.format()
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        const updatedSettings = await db.vendorCommissionSettings.upsert({
            where: { vendorId: session.user.id },
            update: {
                paymentMethod: data.paymentMethod,
                paymentDetails: data.paymentDetails,
                updatedAt: new Date()
            },
            create: {
                vendorId: session.user.id,
                defaultCommissionRate: data.defaultCommissionRate,
                tieredRates: data.tieredRates,
                minimumPayout: data.minimumPayout,
                paymentMethod: data.paymentMethod,
                paymentDetails: data.paymentDetails,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            settings: updatedSettings
        });

    } catch (error) {
        console.error("Error updating commission settings:", error);
        return NextResponse.json(
            {
                error: "Failed to update commission settings",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
