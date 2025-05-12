import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { DiscountType } from "@/lib/prisma-types";

// POST /api/coupons/validate - Validate a coupon code
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { code, cartItems } = await req.json();

        if (!code) {
            return NextResponse.json(
                { error: "Coupon code is required" },
                { status: 400 }
            );
        }

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json(
                { error: "Cart items are required" },
                { status: 400 }
            );
        }

        // Find the coupon
        const coupon = await db.coupon.findUnique({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            },
            include: {
                products: true,
                categories: true,
                couponUsages: {
                    where: {
                        userId: session.user.id
                    }
                },
            }
        });

        if (!coupon) {
            return NextResponse.json(
                { valid: false, error: "Invalid or expired coupon code" },
                { status: 400 }
            );
        }

        // Check if coupon has usage limit and if it's reached
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json(
                { valid: false, error: "This coupon has reached its usage limit" },
                { status: 400 }
            );
        }

        // Check if user has already used this coupon
        if (coupon.couponUsages.length > 0) {
            return NextResponse.json(
                { valid: false, error: "You have already used this coupon" },
                { status: 400 }
            );
        }

        // Calculate cart subtotal
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        // Check minimum purchase requirement
        if (coupon.minimumPurchase && subtotal < coupon.minimumPurchase) {
            return NextResponse.json({
                valid: false,
                error: `This coupon requires a minimum purchase of $${coupon.minimumPurchase.toFixed(2)}`
            });
        }

        // Check product/category restrictions if applicable
        let isApplicable = true;
        let applicableItems = cartItems;

        // If coupon is restricted to specific products or categories
        if (coupon.products.length > 0 || coupon.categories.length > 0) {
            // Filter cart items that match the coupon restrictions
            const productIds = coupon.products.map(p => p.id);
            const categoryIds = coupon.categories.map(c => c.id);

            // Get full product details for cart items
            const productDetails = await db.product.findMany({
                where: {
                    id: { in: cartItems.map(item => item.id) }
                },
                select: {
                    id: true,
                    categoryId: true
                }
            });

            // Map product details by id for easy lookup
            const productsById = productDetails.reduce((acc, product) => {
                acc[product.id] = product;
                return acc;
            }, {});

            // Filter cart items that match restrictions
            applicableItems = cartItems.filter(item => {
                const product = productsById[item.id];
                return (
                    product && (
                        productIds.includes(product.id) ||
                        categoryIds.includes(product.categoryId)
                    )
                );
            });

            if (applicableItems.length === 0) {
                isApplicable = false;
            }
        }

        if (!isApplicable) {
            return NextResponse.json({
                valid: false,
                error: "This coupon is not applicable to items in your cart"
            });
        }

        // Calculate applicable subtotal
        const applicableSubtotal = applicableItems.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        );

        // Calculate discount amount
        let discountAmount = 0;

        if (coupon.discountType === "PERCENTAGE") {
            discountAmount = applicableSubtotal * (coupon.discountValue / 100);
        } else {
            // Fixed amount discount
            discountAmount = Math.min(coupon.discountValue, applicableSubtotal);
        }

        // Apply maximum discount limit if set
        if (coupon.maximumDiscount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
        }

        // Return successful validation result
        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
            },
            discountAmount: discountAmount,
            appliedTo: applicableItems.length === cartItems.length ? "all" : "some",
        });

    } catch (error) {
        console.error("Error validating coupon:", error);
        return NextResponse.json(
            { error: "Failed to validate coupon" },
            { status: 500 }
        );
    }
}
