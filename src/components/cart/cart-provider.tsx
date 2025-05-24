"use client";

import React, { ReactNode } from 'react';
import { useCartSync } from '@/hooks/use-cart-sync';

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    // Initialize the cart sync hook to start syncing
    const { isLoading } = useCartSync();

    // We don't need to block rendering while the cart is loading
    // The hook will handle initializing the cart in the background
    return <>{children}</>;
}
