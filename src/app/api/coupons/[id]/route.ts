import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { cache } from "@/lib/redis";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const coupon = await db.coupon.findUnique({
            where: { id: resolvedParams.id },
            include: {
                products: true,
                categories: true,
                _count: {
                    select: { couponUsages: true }
                },
            },
        });

        if (!coupon) {
            return NextResponse.json(
                { error: "Coupon not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(coupon);
    } catch (error) {
        console.error("Error fetching coupon:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupon" },
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

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Get existing coupon
        const existingCoupon = await db.coupon.findUnique({
            where: { id: resolvedParams.id },
            include: {
                products: true,
                categories: true,
            },
        });

        if (!existingCoupon) {
            return NextResponse.json(
                { error: "Coupon not found" },
                { status: 404 }
            );
        }

        // Check if updating code and if it already exists
        if (data.code && data.code !== existingCoupon.code) {
            const codeExists = await db.coupon.findUnique({
                where: { code: data.code },
            });

            if (codeExists) {
                return NextResponse.json(
                    { error: "Coupon code already exists" },
                    { status: 400 }
                );
            }
        }        // Update the coupon
        const updatedCoupon = await db.coupon.update({
            where: { id: resolvedParams.id },
            data: {
                code: data.code?.toUpperCase(),
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minimumPurchase: data.minimumPurchase,
                maximumDiscount: data.maximumDiscount,
                usageLimit: data.usageLimit,
                isActive: data.isActive,
                showOnBanner: data.showOnBanner,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                // Handle product connections if provided
                ...(data.productIds && {
                    products: {
                        // Disconnect all existing products
                        disconnect: existingCoupon.products.map(p => ({ id: p.id })),
                        // Connect new products
                        connect: data.productIds.map((id: string) => ({ id }))
                    }
                }),
                // Handle category connections if provided
                ...(data.categoryIds && {
                    categories: {
                        // Disconnect all existing categories
                        disconnect: existingCoupon.categories.map(c => ({ id: c.id })),
                        // Connect new categories
                        connect: data.categoryIds.map((id: string) => ({ id }))
                    }
                }),
            },
        });        // Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "UPDATE_COUPON",
                details: `Updated coupon: ${updatedCoupon.code}`,
                performedById: session.user.id,
            },
        });

        // Invalidate related caches
        await cache.del("coupons:admin:list");
        await cache.del(`coupon:code:${existingCoupon.code}`);
        await cache.del(`coupon:code:${updatedCoupon.code}`);
        await cache.del("coupons:banner:active");

        return NextResponse.json(updatedCoupon);
    } catch (error) {
        console.error("Error updating coupon:", error);
        return NextResponse.json(
            { error: "Failed to update coupon" },
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

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }        // Get coupon before deletion for logging
        const coupon = await db.coupon.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!coupon) {
            return NextResponse.json(
                { error: "Coupon not found" },
                { status: 404 }
            );
        }

        await db.coupon.delete({
            where: { id: resolvedParams.id },
        });// Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "DELETE_COUPON",
                details: `Deleted coupon: ${coupon.code}`,
                performedById: session.user.id,
            },
        });

        // Invalidate related caches
        await cache.del("coupons:admin:list");
        await cache.del(`coupon:code:${coupon.code}`);
        await cache.del("coupons:banner:active");

        return NextResponse.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return NextResponse.json(
            { error: "Failed to delete coupon" },
            { status: 500 }
        );
    }
}
