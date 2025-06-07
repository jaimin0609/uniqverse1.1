import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { DiscountType } from "@/lib/prisma-types";
import { Currency } from "@/contexts/currency-provider";

// Helper function to get exchange rate from USD to target currency
function getExchangeRate(targetCurrency: Currency): number {
    // Default exchange rates as fallback (same as in currency-provider.tsx)
    // These represent how many units of target currency equal 1 USD
    const fallbackRates: Record<string, number> = {
        USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.51, CAD: 1.36, JPY: 154.35
    };

    const rate = fallbackRates[targetCurrency] || 1;
    console.log(`Exchange rate for ${targetCurrency}: ${rate} ${targetCurrency} = 1 USD`);
    return rate;
}

// Helper function to convert USD price to target currency
function convertCurrency(amountInUSD: number, targetCurrency: Currency): number {
    const rate = getExchangeRate(targetCurrency);
    const converted = amountInUSD * rate;
    const rounded = targetCurrency === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;

    console.log(`Converting ${amountInUSD} USD to ${targetCurrency}:`);
    console.log(`${amountInUSD} USD × ${rate} = ${converted} ${targetCurrency} (rounded to ${rounded})`);

    return rounded;
}

// Format currency with appropriate symbol
function formatCurrency(amount: number, currencyCode: Currency): string {
    const symbols: Record<string, string> = {
        USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥"
    };
    const symbol = symbols[currencyCode] || "$";

    if (currencyCode === "JPY") {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }

    return `${symbol}${amount.toFixed(2)}`;
}

// POST /api/coupons/validate - Validate a coupon code
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session) {
            return NextResponse.json(
                { error: "Please log in to use Coupons" },
                { status: 401 }
            );
        } const { code, cartItems, currency = "USD", originalSubtotal } = await req.json();

        // Log the received data for debugging
        console.log(`Validating coupon ${code} with currency: ${currency}`);
        const receivedSubtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        console.log(`Received cart subtotal (${currency}): ${receivedSubtotal}`);
        console.log(`Original cart subtotal (USD): ${originalSubtotal || 'Not provided'}`);

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
        }        // Calculate cart subtotal from the received items (which should already be in user currency)
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);        // Use original subtotal if provided, otherwise calculate from cart items
        // The originalSubtotal is in USD from the frontend
        const usdSubtotal = originalSubtotal !== undefined ?
            originalSubtotal :
            (currency === "USD" ? subtotal : subtotal / getExchangeRate(currency as Currency));

        // Log cart details for debugging
        console.log(`Cart subtotal (${currency}): ${subtotal.toFixed(2)}`);
        console.log(`Cart subtotal (USD): ${usdSubtotal.toFixed(2)}`);
        console.log(`Using ${originalSubtotal !== undefined ? 'original' : 'calculated'} USD subtotal for validation`);        // Check minimum purchase requirement, respecting the selected currency
        if (coupon.minimumPurchase) {
            // Convert minimum purchase from USD to user's currency (for display only)
            const minPurchaseInUserCurrency = convertCurrency(coupon.minimumPurchase, currency as Currency);

            console.log(`Minimum purchase (USD): ${coupon.minimumPurchase}`);
            console.log(`Minimum purchase (${currency}): ${minPurchaseInUserCurrency}`);

            // Always compare in USD for consistency - this is critical for accurate validation
            // Round to 2 decimal places to avoid floating point comparison issues
            const roundedUsdSubtotal = Math.round(usdSubtotal * 100) / 100;
            const roundedMinPurchase = Math.round(coupon.minimumPurchase * 100) / 100;

            if (roundedUsdSubtotal < roundedMinPurchase) {
                const formattedMinPurchase = formatCurrency(minPurchaseInUserCurrency, currency as Currency);
                console.log(`Validation FAILED: ${roundedUsdSubtotal.toFixed(2)} USD < ${roundedMinPurchase} USD`);
                return NextResponse.json({
                    valid: false,
                    error: `This coupon requires a minimum purchase of ${formattedMinPurchase}`
                });
            } else {
                // Log successful validation
                console.log(`Validation PASSED: ${roundedUsdSubtotal.toFixed(2)} USD >= ${roundedMinPurchase} USD`);
            }
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

        // Calculate applicable subtotal from the cart items (in user's currency)
        const applicableSubtotal = applicableItems.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        );        // Convert to USD for consistent calculations if not already in USD
        const rate = getExchangeRate(currency as Currency);

        // Calculate the applicable subtotal in USD properly
        // If originalSubtotal is provided, we need to adjust the applicableSubtotal accordingly
        let applicableSubtotalInUSD;

        if (originalSubtotal !== undefined && currency !== "USD") {
            // We need to calculate what portion of the original subtotal the applicable items represent
            const cartRatio = applicableItems.length === cartItems.length ?
                1 : applicableSubtotal / subtotal;

            // Apply that ratio to the original USD subtotal for accuracy
            applicableSubtotalInUSD = originalSubtotal * cartRatio;
            console.log(`Using ratio calculation: ${cartRatio.toFixed(4)} × ${originalSubtotal} USD = ${applicableSubtotalInUSD.toFixed(2)} USD`);
        } else {
            // Standard conversion if no originalSubtotal or currency is USD
            applicableSubtotalInUSD = currency === "USD" ? applicableSubtotal : applicableSubtotal / rate;
        }

        console.log(`Applicable subtotal (${currency}): ${applicableSubtotal.toFixed(2)}`);
        console.log(`Applicable subtotal (USD): ${applicableSubtotalInUSD.toFixed(2)}`);

        // Calculate discount amount in USD first
        let discountAmountUSD = 0;

        if (coupon.discountType === "PERCENTAGE") {
            // Percentage discounts work the same regardless of currency
            discountAmountUSD = applicableSubtotalInUSD * (coupon.discountValue / 100);
            console.log(`Percentage discount (${coupon.discountValue}%): ${discountAmountUSD.toFixed(2)} USD`);
        } else {
            // Fixed amount discount in USD
            discountAmountUSD = Math.min(coupon.discountValue, applicableSubtotalInUSD);
            console.log(`Fixed amount discount: ${discountAmountUSD.toFixed(2)} USD (min of ${coupon.discountValue} USD and ${applicableSubtotalInUSD.toFixed(2)} USD)`);
        }

        // Apply maximum discount limit if set (in USD)
        if (coupon.maximumDiscount !== null) {
            const oldDiscountAmount = discountAmountUSD;
            discountAmountUSD = Math.min(discountAmountUSD, coupon.maximumDiscount);
            if (oldDiscountAmount !== discountAmountUSD) {
                console.log(`Maximum discount applied: ${discountAmountUSD.toFixed(2)} USD (max: ${coupon.maximumDiscount} USD)`);
            }
        }        // Convert the final discount amount from USD to user's currency
        const discountAmount = convertCurrency(discountAmountUSD, currency as Currency);

        // Log all the relevant information for debugging
        console.log(`Final discount amount (${currency}): ${discountAmount.toFixed(2)}`);
        console.log(`Final discount amount (USD): ${discountAmountUSD.toFixed(2)}`);
        console.log(`\n--- COUPON VALIDATION SUMMARY ---`);
        console.log(`Coupon code: ${coupon.code}`);
        console.log(`User currency: ${currency}`);
        console.log(`Cart subtotal (USD): ${usdSubtotal.toFixed(2)}`);
        console.log(`Cart subtotal (${currency}): ${subtotal.toFixed(2)}`);
        console.log(`Minimum purchase (USD): ${coupon.minimumPurchase || 'None'}`);
        console.log(`Minimum purchase (${currency}): ${coupon.minimumPurchase ? convertCurrency(coupon.minimumPurchase, currency as Currency) : 'None'}`);
        console.log(`Discount amount (${currency}): ${discountAmount.toFixed(2)}`);
        console.log(`Discount amount (USD): ${discountAmountUSD.toFixed(2)}`);
        console.log(`-----------------------------\n`);

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
