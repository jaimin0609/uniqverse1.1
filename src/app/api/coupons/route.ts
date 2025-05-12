import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

// GET /api/coupons - Get all coupons (admin)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const code = url.searchParams.get("code");

        // If checking by code, no auth required (for validation during checkout)
        if (code) {
            const coupon = await db.coupon.findUnique({
                where: { code },
            });

            if (!coupon) {
                return NextResponse.json(
                    { error: "Coupon not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(coupon);
        }

        // For listing all coupons, require admin authentication
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const coupons = await db.coupon.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { couponUsages: true }
                }
            }
        });

        return NextResponse.json(coupons);
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}

// POST /api/coupons - Create a new coupon (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Check if coupon code already exists
        const existingCoupon = await db.coupon.findUnique({
            where: { code: data.code },
        });

        if (existingCoupon) {
            return NextResponse.json(
                { error: "Coupon code already exists" },
                { status: 400 }
            );
        }

        // Create coupon in database
        const coupon = await db.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minimumPurchase: data.minimumPurchase,
                maximumDiscount: data.maximumDiscount,
                usageLimit: data.usageLimit,
                isActive: data.isActive ?? true,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                ...(data.productIds && {
                    products: {
                        connect: data.productIds.map((id: string) => ({ id }))
                    }
                }),
                ...(data.categoryIds && {
                    categories: {
                        connect: data.categoryIds.map((id: string) => ({ id }))
                    }
                }),
            },
        });

        // Log the admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: "CREATE_COUPON",
                details: `Created coupon: ${coupon.code}`,
                performedById: session.user.id,
            },
        });

        return NextResponse.json(coupon, { status: 201 });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
            { error: "Failed to create coupon" },
            { status: 500 }
        );
    }
}
