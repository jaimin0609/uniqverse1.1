import React from 'react';
import { useCurrency } from '@/contexts/currency-provider';

interface FormattedPriceProps {
    amount: number;
    className?: string;
    showCurrency?: boolean;
}

export function FormattedPrice({
    amount,
    className = "",
    showCurrency = false
}: FormattedPriceProps) {
    const { convertPrice, formatPrice, currency, isLoading } = useCurrency();

    // Convert the price from USD to the selected currency
    const convertedPrice = convertPrice(amount);

    return (
        <span className={className}>
            {isLoading ? (
                // Show a loading placeholder
                <span className="opacity-70">...</span>
            ) : (
                <>
                    {formatPrice(convertedPrice)}
                    {showCurrency && <span className="ml-1 text-xs opacity-70">{currency}</span>}
                </>
            )}
        </span>
    );
}