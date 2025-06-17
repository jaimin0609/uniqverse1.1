import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        // Await params before accessing
        const { id } = resolvedParams;

        const promotion = await db.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return NextResponse.json(
                { error: "Promotion not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(promotion);
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return NextResponse.json(
            { error: "Failed to fetch promotion" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        // Await params before accessing
        const { id } = resolvedParams;

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await req.json();

        const updatedPromotion = await db.promotion.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                linkUrl: data.linkUrl,
                position: data.position,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: data.isActive,
            },
        });

        // Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "UPDATE_PROMOTION",
                details: `Updated promotion: ${updatedPromotion.title}`,
                performedById: session.user.id,
            },
        });

        return NextResponse.json(updatedPromotion);
    } catch (error) {
        console.error("Error updating promotion:", error);
        return NextResponse.json(
            { error: "Failed to update promotion" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        // Await params before accessing
        const { id } = resolvedParams;

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get promotion before deletion for logging
        const promotion = await db.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return NextResponse.json(
                { error: "Promotion not found" },
                { status: 404 }
            );
        }

        await db.promotion.delete({
            where: { id },
        });

        // Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "DELETE_PROMOTION",
                details: `Deleted promotion: ${promotion.title}`,
                performedById: session.user.id,
            },
        });

        return NextResponse.json({ message: "Promotion deleted successfully" });
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return NextResponse.json(
            { error: "Failed to delete promotion" },
            { status: 500 }
        );
    }
}
