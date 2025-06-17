"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DiscountLevelFilter() {
    const router = useRouter();
    const searchParams = useSearchParams(); const handleDiscountFilter = (minDiscount?: string, maxDiscount?: string) => {
        // Create a new URLSearchParams instance
        const params = new URLSearchParams(searchParams?.toString() || "");

        // Update or remove the discount parameters
        if (minDiscount) {
            params.set('minDiscount', minDiscount);
        } else {
            params.delete('minDiscount');
        }

        if (maxDiscount) {
            params.set('maxDiscount', maxDiscount);
        } else {
            params.delete('maxDiscount');
        }

        // Navigate to the updated URL
        router.push(`/shop/sale?${params.toString()}`);
    };

    // Get current discount filter values
    const currentMinDiscount = searchParams?.get('minDiscount');
    const currentMaxDiscount = searchParams?.get('maxDiscount');

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm font-medium text-gray-700">Discount Level:</span>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className={!currentMinDiscount && !currentMaxDiscount ? "bg-red-50 text-red-600" : ""}
                    onClick={() => handleDiscountFilter()}
                >
                    All Discounts
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={currentMinDiscount === '10' && currentMaxDiscount === '30' ? "bg-red-50 text-red-600" : ""}
                    onClick={() => handleDiscountFilter('10', '30')}
                >
                    10-30%
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={currentMinDiscount === '30' && currentMaxDiscount === '50' ? "bg-red-50 text-red-600" : ""}
                    onClick={() => handleDiscountFilter('30', '50')}
                >
                    30-50%
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={currentMinDiscount === '50' && !currentMaxDiscount ? "bg-red-50 text-red-600" : ""}
                    onClick={() => handleDiscountFilter('50')}
                >
                    50%+
                </Button>
            </div>
        </div>
    );
}
