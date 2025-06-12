import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache } from "@/lib/redis";

// GET /api/coupons/banner - Get active coupons that should be shown on banners (public endpoint)
export async function GET(req: NextRequest) {
    try {
        // Check cache first
        const cacheKey = "coupons:banner:active";
        const cachedCoupons = await cache.get(cacheKey);
        if (cachedCoupons) {
            return NextResponse.json(cachedCoupons);
        }

        // Get current date/time
        const now = new Date();

        // Fetch active coupons that should be shown on banners
        const coupons = await db.coupon.findMany({
            where: {
                isActive: true,
                showOnBanner: true,
                startDate: {
                    lte: now
                },
                endDate: {
                    gte: now
                }
            },
            select: {
                id: true,
                code: true,
                description: true,
                discountType: true,
                discountValue: true,
                endDate: true,
                minimumPurchase: true,
                maximumDiscount: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Limit to 5 coupons for banner display
        });

        // Cache for 5 minutes (banner coupons are time-sensitive)
        await cache.set(cacheKey, coupons, 300);

        return NextResponse.json(coupons);
    } catch (error) {
        console.error("Error fetching banner coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch banner coupons" },
            { status: 500 }
        );
    }
}
