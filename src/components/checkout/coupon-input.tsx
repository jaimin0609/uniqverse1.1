"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, CheckCircle, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { DiscountType } from "@/lib/prisma-types";

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

    const validateCoupon = async () => {
        if (!code) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    cartItems: items,
                }),
            });

            const data: CouponValidationResponse = await response.json();

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
    };

    // Format the saved amount
    const formattedSavedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(savedAmount);

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
