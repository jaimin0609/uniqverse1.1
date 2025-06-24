"use client";

import { useCartStore } from '@/store/cart';
import type { CartItem } from '@/store/cart';

/**
 * This hook provides enhanced cart functions that sync with the server
 * It wraps around the basic cart store functions to provide server-synced versions
 */
export function useServerSyncedCart() {
    const {
        items,
        subtotal,
        itemCount,
        totalItems,
        addItem,
        updateQuantity,
        updateItemQuantity,
        removeItem: removeItemLocal,
        clearCart: clearCartLocal
    } = useCartStore();    /**
     * Remove an item from the cart and sync with server
     */
    const removeItem = async (id: string, variantId?: string) => {
        try {
            console.log(`Starting removal of item ${id} with variant ${variantId}`);

            // First remove from local cart for immediate UI update
            removeItemLocal(id, variantId);

            // Get the cart ID for server sync
            const cartId = localStorage.getItem('uniqverse-cart-id');
            console.log(`Cart ID for sync: ${cartId}`);

            // Sync the updated cart state with the server immediately
            await syncCartWithServer();

            // Add a small delay to ensure the server operation completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Force a verification by reloading from server to ensure consistency
            await forceReloadFromServer();

            console.log(`Item ${id} successfully removed and synced`);
        } catch (error) {
            console.error('Error removing item from cart:', error);

            // Since we already removed from local cart, we should try to restore it if server sync failed
            // But for now, we'll just log the error and let the user know
            throw error;
        }
    };/**
     * Clear the entire cart and sync with server
     */
    const clearCart = async () => {
        try {
            // Get cart ID from localStorage (for guest users)
            const cartId = localStorage.getItem('uniqverse-cart-id');

            // Call the API to clear the server cart
            if (cartId) {
                await fetch(`/api/cart?cartId=${cartId}`, {
                    method: 'DELETE',
                });
            } else {
                await fetch('/api/cart', {
                    method: 'DELETE',
                });
            }

            // Clear the cart ID from localStorage to prevent re-syncing
            localStorage.removeItem('uniqverse-cart-id');

            // Then clear the local cart
            clearCartLocal();
        } catch (error) {
            console.error('Error clearing cart:', error);
            // Still clear local cart and cart ID even if server request fails
            localStorage.removeItem('uniqverse-cart-id');
            clearCartLocal();
        }
    };    /**
     * Helper function to sync current cart state with server
     */
    const syncCartWithServer = async () => {
        try {
            // Get cart ID from localStorage
            const cartId = localStorage.getItem('uniqverse-cart-id');

            // Get the current items from the store
            const currentItems = useCartStore.getState().items;

            // Prepare the request payload
            const payload = {
                cartId: cartId,
                items: currentItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity
                }))
            };

            console.log('Syncing cart with server:', payload);

            // Call the API to update the server cart with cache busting
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add cache-busting headers to ensure fresh request
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to sync cart with server: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // Update cart ID if provided
            if (data.cartId) {
                localStorage.setItem('uniqverse-cart-id', data.cartId);
            }

            console.log('Cart synced successfully:', data);
            return data;
        } catch (error) {
            console.error('Error syncing cart with server:', error);
            throw error;
        }
    };
    /**
     * Add an item to the cart and sync with server
     */
    const addItemAndSync = async (item: CartItem) => {
        // First add to local cart for immediate UI update
        addItem(item);

        // Then sync the entire cart with the server
        try {
            await syncCartWithServer();
        } catch (error) {
            console.error('Error syncing cart after adding item:', error);
            // Item is already added to local cart, so no need to rollback
        }
    };    /**
     * Force reload cart from server (useful when suspecting sync issues)
     */
    const forceReloadFromServer = async () => {
        try {
            const cartId = localStorage.getItem('uniqverse-cart-id');
            const url = cartId ? `/api/cart?cartId=${cartId}&_t=${Date.now()}` : `/api/cart?_t=${Date.now()}`;

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reload cart from server');
            }

            const data = await response.json();

            // Clear local cart and reload from server
            clearCartLocal();

            if (data.items?.length > 0) {
                data.items.forEach((item: CartItem) => {
                    addItem(item);
                });
            }

            // Update cart ID if provided
            if (data.cartId) {
                localStorage.setItem('uniqverse-cart-id', data.cartId);
            }

            console.log('Cart force reloaded from server:', data.items?.length || 0, 'items');
            return data;
        } catch (error) {
            console.error('Error force reloading cart from server:', error);
            throw error;
        }
    };

    return {
        // Original properties
        items,
        subtotal,
        itemCount,
        totalItems,

        // Enhanced functions with server sync
        addItem: addItemAndSync,
        updateQuantity,
        updateItemQuantity,
        removeItem,
        clearCart,
        syncCartWithServer,
        forceReloadFromServer
    };
}
