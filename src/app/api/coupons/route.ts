import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { cache, cacheInvalidation } from "@/lib/redis";

// GET /api/coupons - Get all coupons (admin)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const code = url.searchParams.get("code");        // If checking by code, no auth required (for validation during checkout)
        if (code) {
            // Check cache first for individual coupon lookups
            const couponCacheKey = `coupon:code:${code}`;
            const cachedCoupon = await cache.get(couponCacheKey);
            if (cachedCoupon) {
                return NextResponse.json(cachedCoupon);
            }

            const coupon = await db.coupon.findUnique({
                where: { code },
            });

            if (!coupon) {
                return NextResponse.json(
                    { error: "Coupon not found" },
                    { status: 404 }
                );
            }

            // Cache individual coupon for 10 minutes
            await cache.set(couponCacheKey, coupon, 600);
            return NextResponse.json(coupon);
        }        // For listing all coupons, require admin authentication
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check cache for coupon list
        const listCacheKey = "coupons:admin:list";
        const cachedList = await cache.get(listCacheKey);
        if (cachedList) {
            return NextResponse.json(cachedList);
        }

        const coupons = await db.coupon.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { couponUsages: true }
                }
            }
        });

        // Cache coupon list for 5 minutes (admin data changes more frequently)
        await cache.set(listCacheKey, coupons, 300);
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

        // Invalidate coupons cache
        await cache.del("coupons:admin:list");
        await cache.del(`coupon:code:${coupon.code}`);

        return NextResponse.json(coupon, { status: 201 });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
            { error: "Failed to create coupon" },
            { status: 500 }
        );
    }
}
