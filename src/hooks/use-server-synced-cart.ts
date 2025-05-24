"use client";

import { useCartStore } from '@/store/cart';

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
    } = useCartStore();

    /**
     * Remove an item from the cart and sync with server
     */
    const removeItem = async (id: string, variantId?: string) => {
        try {
            // First remove from local cart for immediate UI update
            removeItemLocal(id, variantId);

            // Then sync the entire cart with the server
            await syncCartWithServer();
        } catch (error) {
            console.error('Error removing item from cart:', error);
            // Item is already removed from local cart, so no need to rollback
        }
    };

    /**
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

            // Then clear the local cart
            clearCartLocal();
        } catch (error) {
            console.error('Error clearing cart:', error);
            // Still clear local cart even if server request fails
            clearCartLocal();
        }
    };

    /**
     * Helper function to sync current cart state with server
     */
    const syncCartWithServer = async () => {
        try {
            // Get cart ID from localStorage
            const cartId = localStorage.getItem('uniqverse-cart-id');

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

            // Update cart ID if provided
            if (data.cartId) {
                localStorage.setItem('uniqverse-cart-id', data.cartId);
            }

            return data;
        } catch (error) {
            console.error('Error syncing cart with server:', error);
            throw error;
        }
    };
    /**
     * Add an item to the cart and sync with server
     */
    const addItemAndSync = async (item: any) => {
        // First add to local cart for immediate UI update
        addItem(item);

        // Then sync the entire cart with the server
        try {
            await syncCartWithServer();
        } catch (error) {
            console.error('Error syncing cart after adding item:', error);
            // Item is already added to local cart, so no need to rollback
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
        syncCartWithServer
    };
}
