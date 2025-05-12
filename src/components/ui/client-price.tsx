"use client";

import { FormattedPrice } from "@/components/ui/formatted-price";

// This component renders the price with currency conversion
export function ClientPrice({ amount }: { amount: number }) {
    return <FormattedPrice amount={amount} />;
}