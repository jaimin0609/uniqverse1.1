"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, CheckCircle, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { DiscountType } from "@/lib/prisma-types";
import { useCurrency } from "@/contexts/currency-provider";

interface CouponInputProps {
    onApplyCoupon: (discountAmount: number, couponCode: string) => void;
    onRemoveCoupon: () => void;
    subtotal: number;
}

interface CouponValidationResponse {
    valid: boolean;
    error?: string;
    coupon?: {
        id: string;
        code: string;
        discountType: DiscountType;
        discountValue: number;
    };
    discountAmount: number;
    appliedTo: string;
}

export function CouponInput({ onApplyCoupon, onRemoveCoupon, subtotal }: CouponInputProps) {
    const [code, setCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedAmount, setSavedAmount] = useState(0);
    const { items } = useCartStore();
    const { currency, convertPrice, formatPrice } = useCurrency(); const validateCoupon = async () => {
        if (!code) return;

        setIsLoading(true);
        setError(null); try {
            // Original cart items have prices in USD, we need to track both:
            // 1. Original USD prices for accurate backend calculations
            // 2. Converted prices in user's currency for display

            // Convert cart item prices to the current currency for display and local validation
            const convertedCartItems = items.map(item => ({
                ...item,
                price: convertPrice(item.price) // Convert from USD to user's currency
            }));

            // Calculate and log both subtotals for verification
            const rawSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const convertedSubtotal = convertedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            console.log(`Cart subtotal (USD): $${rawSubtotal.toFixed(2)}`);
            console.log(`Cart subtotal (${currency}): ${formatPrice(convertedSubtotal)}`);

            // Prepare the request payload with converted prices
            const payload = {
                code,
                cartItems: convertedCartItems,
                currency, // Send the current currency to the API
                originalSubtotal: rawSubtotal // Send the original USD subtotal for reference
            };

            // Log the request for debugging
            console.log(`Validating coupon with currency: ${currency}`, payload);

            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }); const data: CouponValidationResponse = await response.json();

            // Log the response for debugging
            console.log("Coupon validation response:", data);

            if (!response.ok) {
                setError(data.error || "Error validating coupon");
                return;
            }

            if (!data.valid) {
                setError(data.error || "Invalid coupon code");
                return;
            }

            // Successfully validated coupon
            setAppliedCoupon(data.coupon?.code || code);
            setSavedAmount(data.discountAmount);

            // Call the parent function to update the total
            onApplyCoupon(data.discountAmount, data.coupon?.code || code);

            // Clear the input
            setCode("");

        } catch (err) {
            console.error("Error validating coupon:", err);
            setError("An error occurred while validating the coupon");
        } finally {
            setIsLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setSavedAmount(0);
        onRemoveCoupon();
    };    // Format the saved amount using the currency formatter
    const formattedSavedAmount = formatPrice(savedAmount);

    return (
        <div className="mt-4">
            <div className="text-sm font-medium mb-2">Promo Code</div>

            {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                        <CheckCircle size={18} className="text-green-500 mr-2" />
                        <div>
                            <div className="flex items-center">
                                <span className="font-medium">{appliedCoupon}</span>
                                <span className="ml-2 text-green-600 text-sm">
                                    You saved {formattedSavedAmount}!
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={16} />
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Enter promo code"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        validateCoupon();
                                    }
                                }}
                                className="pl-9"
                            />
                            <Tag
                                size={16}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                        </div>
                        <Button
                            onClick={validateCoupon}
                            disabled={!code || isLoading}
                            className="whitespace-nowrap"
                        >
                            {isLoading ? "Applying..." : "Apply"}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-2 flex items-start text-red-500 text-sm">
                            <AlertCircle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
