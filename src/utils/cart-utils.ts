/**
 * Utility to clear all cart-related data
 * Used when user logs out or when we need to reset cart state
 */
export function clearCartData() {
    if (typeof window === 'undefined') return;

    try {
        // Clear Zustand persisted cart data
        localStorage.removeItem('uniqverse-cart');

        // Clear cart ID
        localStorage.removeItem('uniqverse-cart-id');

        // Clear any other cart-related items that might exist
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('cart') || key.includes('uniqverse-cart')) {
                localStorage.removeItem(key);
            }
        });

        console.log('Cart data cleared successfully');
    } catch (error) {
        console.error('Error clearing cart data:', error);
    }
}

/**
 * Clear cart data for a specific user (when switching users)
 */
export function clearUserCart(userId?: string) {
    clearCartData();

    // If we have access to Zustand store, clear it too
    if (typeof window !== 'undefined' && (window as any).__ZUSTAND_CART_STORE__) {
        try {
            (window as any).__ZUSTAND_CART_STORE__.clearCart();
        } catch (error) {
            console.error('Error clearing Zustand cart store:', error);
        }
    }
}
