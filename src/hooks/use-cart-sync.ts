"use client";

import { useEffect, useState } from 'react';
import { useCartStore, type CartItem } from '@/store/cart';
import { useSession } from 'next-auth/react';
import { clearCartData } from '@/utils/cart-utils';

/**
 * Hook to synchronize the local cart (Zustand) with the server database
 * This enables cart persistence across different devices and sessions
 */
export function useCartSync() {
    const { data: session, status } = useSession();
    const { items, addItem, clearCart } = useCartStore();
    const [cartId, setCartId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUserId, setLastUserId] = useState<string | null>(null);    // Handle user session changes (login/logout)
    useEffect(() => {
        const currentUserId = session?.user?.id || null;

        // If user has changed (logout or different user login), clear the cart
        if (lastUserId !== currentUserId) {
            clearCart();
            clearCartData(); // Clear localStorage data too
            setCartId(null);
            setIsInitialized(false);

            setLastUserId(currentUserId);
        }
    }, [session?.user?.id, lastUserId, clearCart]);// On mount or session changes, load the cart from the server
    useEffect(() => {
        // Don't load cart until session status is determined
        if (status === 'loading') {
            return;
        }

        const loadServerCart = async () => {
            try {
                setIsLoading(true);

                // If we already have a cart ID in localStorage, use it for guest users
                const storedCartId = localStorage.getItem('uniqverse-cart-id');                // Construct the API URL with cache busting to ensure fresh data
                const timestamp = Date.now();
                const url = storedCartId && !session?.user
                    ? `/api/cart?cartId=${storedCartId}&_t=${timestamp}`
                    : `/api/cart?_t=${timestamp}`;

                const response = await fetch(url, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch cart from server');
                }

                const data = await response.json();

                // Store the cart ID for future use (useful for guest users)
                if (data.cartId) {
                    localStorage.setItem('uniqverse-cart-id', data.cartId);
                    setCartId(data.cartId);
                }                // Always load from server on initialization to ensure sync
                // This prevents deleted items from reappearing when user revisits
                const currentLocalItems = useCartStore.getState().items;

                if (!isInitialized) {
                    // Only load from server if local cart is empty
                    // This prevents overwriting local changes with stale server data
                    if (currentLocalItems.length === 0 && data.items?.length > 0) {
                        data.items.forEach((item: CartItem) => {
                            addItem(item);
                        });
                    } else if (currentLocalItems.length > 0) {
                        // Local cart has items, sync them to server instead of loading from server
                        // This happens in the next useEffect
                    }
                } else if (currentLocalItems.length === 0 && data.items?.length > 0) {
                    // Local cart is empty but server has items - load from server
                    data.items.forEach((item: CartItem) => {
                        addItem(item);
                    });
                } setIsInitialized(true);
            } catch (error) {
                console.error('Error syncing cart with server:', error);
                setIsInitialized(true); // Still mark as initialized to avoid infinite loops
            } finally {
                setIsLoading(false);
            }
        };

        loadServerCart();
    }, [session, status, addItem, clearCart, isInitialized]);    // Whenever the local cart changes after initialization, update the server cart
    useEffect(() => {
        const syncCartToServer = async () => {
            if (!isInitialized) {
                return;
            }

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
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
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
