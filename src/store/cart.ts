import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearCartData } from '@/utils/cart-utils';

export type CartItem = {
    id: string;
    productId: string;
    slug: string; // Added slug for proper URLs
    name: string;
    price: number;
    quantity: number;
    image: string;
    variantId?: string;
    variantName?: string;
};

type CartStore = {
    items: CartItem[];
    subtotal: number;
    itemCount: number;
    totalItems: number; // Alias for itemCount used in some components

    // Actions
    addItem: (item: CartItem) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateItemQuantity: (id: string, quantity: number, variantId?: string) => void; // Added to match component usage
    removeItem: (id: string, variantId?: string) => void; // Updated to match component usage
    clearCart: () => void;
    calculateCartValues: () => { subtotal: number; itemCount: number };
};

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            subtotal: 0,
            itemCount: 0,
            // Add totalItems as an alias for itemCount
            get totalItems() {
                return get().itemCount;
            },

            calculateCartValues: () => {
                const state = get();
                const subtotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0);
                return { subtotal, itemCount };
            },

            addItem: (newItem: CartItem) => {
                set((state) => {                    // Check if the item is already in the cart
                    const existingItemIndex = state.items.findIndex(
                        (item) => item.productId === newItem.productId &&
                            item.variantId === newItem.variantId
                    );

                    let updatedItems = [...state.items];

                    if (existingItemIndex !== -1) {
                        // Update quantity of existing item
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
                        };
                    } else {
                        // Add new item
                        updatedItems.push(newItem);
                    }

                    // Calculate new subtotal and item count based on the updated items
                    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const itemCount = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

                    return {
                        items: updatedItems,
                        subtotal,
                        itemCount,
                    };
                });
            },

            updateQuantity: (id: string, quantity: number) => {
                set((state) => {
                    // Update item quantity
                    const updatedItems = state.items.map((item) =>
                        item.id === id
                            ? { ...item, quantity: Math.max(1, quantity) } // Ensure quantity is at least 1
                            : item
                    );

                    // Calculate directly from updatedItems
                    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const itemCount = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

                    return {
                        items: updatedItems,
                        subtotal,
                        itemCount,
                    };
                });
            },

            // Add updateItemQuantity function to match what's used in components
            updateItemQuantity: (id: string, quantity: number, variantId?: string) => {
                set((state) => {
                    // Update item quantity, considering both id and variantId
                    const updatedItems = state.items.map((item) =>
                        (item.id === id && (!variantId || item.variantId === variantId))
                            ? { ...item, quantity: Math.max(1, quantity) } // Ensure quantity is at least 1
                            : item
                    );

                    // Calculate directly from updatedItems
                    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const itemCount = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

                    return {
                        items: updatedItems,
                        subtotal,
                        itemCount,
                    };
                });
            },            // Update removeItem to handle variantId more precisely
            removeItem: (id: string, variantId?: string) => {
                set((state) => {
                    console.log(`Removing item from cart - id: ${id}, variantId: ${variantId}`);
                    console.log('Current cart items:', state.items);

                    // Remove item from cart with precise matching
                    const updatedItems = state.items.filter((item) => {
                        const idMatch = item.id === id;
                        const variantMatch = variantId ? item.variantId === variantId : true;
                        const shouldRemove = idMatch && variantMatch;

                        if (shouldRemove) {
                            console.log(`Removing item:`, item);
                        }

                        return !shouldRemove;
                    });

                    console.log('Updated cart items after removal:', updatedItems);

                    // Calculate directly from updatedItems
                    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const itemCount = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

                    return {
                        items: updatedItems,
                        subtotal,
                        itemCount,
                    };
                });
            }, clearCart: () => {
                set({ items: [], subtotal: 0, itemCount: 0 });
                // Clear all cart-related localStorage data
                clearCartData();
            },
        }), {
        name: 'uniqverse-cart',
        // Use this to merge the persisted state with the initial state and ensure synchronization
        partialize: (state) => ({
            items: state.items,
        }),
        // Add onRehydrateStorage to update subtotal and itemCount when state is rehydrated
        onRehydrateStorage: () => (state) => {
            if (state) {
                const { subtotal, itemCount } = state.calculateCartValues();
                state.subtotal = subtotal;
                state.itemCount = itemCount;
            }
        },
        // Add version to force clear old cart data when needed
        version: 1,
    }
    )
);