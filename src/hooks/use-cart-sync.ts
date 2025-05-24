"use client";

import { useEffect, useState } from 'react';
import { useCartStore, type CartItem } from '@/store/cart';
import { useSession } from 'next-auth/react';

/**
 * Hook to synchronize the local cart (Zustand) with the server database
 * This enables cart persistence across different devices and sessions
 */
export function useCartSync() {
    const { data: session } = useSession();
    const { items, addItem, clearCart } = useCartStore();
    const [cartId, setCartId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // On mount or session changes, load the cart from the server
    useEffect(() => {
        const loadServerCart = async () => {
            try {
                // If we already have a cart ID in localStorage, use it for guest users
                const storedCartId = localStorage.getItem('uniqverse-cart-id');

                // Construct the API URL based on whether we have a stored cart ID
                const url = storedCartId && !session?.user
                    ? `/api/cart?cartId=${storedCartId}`
                    : '/api/cart';

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Failed to fetch cart from server');
                }

                const data = await response.json();

                // Store the cart ID for future use (useful for guest users)
                if (data.cartId) {
                    localStorage.setItem('uniqverse-cart-id', data.cartId);
                    setCartId(data.cartId);
                }

                // Only replace local cart if server cart has items and local hasn't been modified
                if (data.items?.length > 0 && !isInitialized) {
                    // First clear current cart to prevent duplicates
                    clearCart();

                    // Add all items from server to local cart
                    data.items.forEach((item: CartItem) => {
                        addItem(item);
                    });
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Error syncing cart with server:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadServerCart();
    }, [session, addItem, clearCart, isInitialized]);

    // Whenever the local cart changes after initialization, update the server cart
    useEffect(() => {
        const syncCartToServer = async () => {
            if (!isInitialized) return;

            try {
                // Prepare the request payload
                const payload = {
                    cartId: cartId,
                    items: items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    }))
                };

                // Call the API to update the server cart
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error('Failed to sync cart with server');
                }

                const data = await response.json();

                // Update cart ID if provided (especially important for guest users)
                if (data.cartId) {
                    localStorage.setItem('uniqverse-cart-id', data.cartId);
                    setCartId(data.cartId);
                }
            } catch (error) {
                console.error('Error syncing cart with server:', error);
            }
        };

        // Debounce the sync to avoid too many API calls
        const timeoutId = setTimeout(syncCartToServer, 500);

        return () => clearTimeout(timeoutId);
    }, [items, isInitialized, cartId]);

    return {
        isLoading,
        cartId
    };
}
