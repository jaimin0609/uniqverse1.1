"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useServerSyncedCart } from "@/hooks/use-server-synced-cart";
import { Button } from "@/components/ui/button";
import { ClientPrice } from "@/components/ui/client-price";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const router = useRouter();
    // Use the server-synced cart hook instead of the store directly
    const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart, syncCartWithServer } = useServerSyncedCart();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Refs to track timeouts for cleanup
    const checkoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);    // Reset navigation state when drawer is opened
    useEffect(() => {
        if (isOpen) {
            setIsNavigating(false);
        }
    }, [isOpen]);

    // Cleanup timeouts when component unmounts or when drawer closes
    useEffect(() => {
        return () => {
            if (checkoutTimeoutRef.current) {
                clearTimeout(checkoutTimeoutRef.current);
                checkoutTimeoutRef.current = null;
            }
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
                navigationTimeoutRef.current = null;
            }
        };
    }, []);

    // Clear timeouts when drawer closes
    useEffect(() => {
        if (!isOpen) {
            if (checkoutTimeoutRef.current) {
                clearTimeout(checkoutTimeoutRef.current);
                checkoutTimeoutRef.current = null;
            }
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
                navigationTimeoutRef.current = null;
            }
        }
    }, [isOpen]);

    // Handle escape key press to close drawer
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscapeKey);
            // Prevent scrolling when drawer is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscapeKey);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);    // Function to handle quantity changes with server sync
    const handleQuantityChange = async (id: string, newQuantity: number) => {
        if (newQuantity >= 1) {
            // Update local cart first for immediate UI feedback
            updateQuantity(id, newQuantity);

            // Then sync the cart with the server
            try {
                setIsLoading(true);
                await syncCartWithServer();
            } catch (error) {
                console.error('Error syncing cart after quantity change:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };    // Improved function to proceed to checkout with server sync
    const handleCheckout = async () => {
        if (isNavigating) return; // Prevent multiple clicks

        setIsNavigating(true);
        setIsLoading(true);

        try {
            // Sync cart with server before checkout
            await syncCartWithServer();
        } catch (error) {
            console.error('Error syncing cart before checkout:', error);
            // Continue with checkout even if sync fails
        } finally {
            setIsLoading(false);
        }

        onClose();

        // Short delay to ensure the drawer closes cleanly before navigation
        checkoutTimeoutRef.current = setTimeout(() => {
            router.push("/checkout");

            // Safety timeout to reset navigation state if something goes wrong
            navigationTimeoutRef.current = setTimeout(() => {
                setIsNavigating(false);
            }, 5000);
        }, 100);
    };

    // We can use the clearCart function directly from useServerSyncedCart
    // as it already handles both client and server clearing
    const handleClearCart = async () => {
        try {
            setIsLoading(true);
            await clearCart();
        } catch (error) {
            console.error('Error clearing cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // If drawer is not open, don't render anything
    if (!isOpen) return null; return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            {/* Drawer container */}
            <div
                className="fixed inset-y-0 right-0 flex flex-col w-full sm:w-96 max-w-full bg-white shadow-xl animate-slide-in-right cart-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-drawer-title"
                data-testid="cart-drawer"
            >{/* Drawer header */}                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="cart-drawer-title" className="text-lg font-semibold flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Your Cart ({items.length > 0 ? itemCount : 0})
                        {isLoading && (
                            <span className="ml-2 inline-block w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Close cart"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Drawer content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                            <p className="text-sm text-gray-500 mb-6">Add some products to your cart to continue shopping</p>
                            <Button onClick={onClose} className="mt-2">
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {items.map((item) => (
                                <li key={item.id} className="py-4 flex">
                                    {/* Product Image */}
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={80}
                                            height={80}
                                            className="h-full w-full object-cover object-center"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="ml-4 flex flex-1 flex-col">
                                        <div className="flex justify-between text-base font-medium text-gray-900">                                            <h3>
                                            <Link href={`/products/${item.slug}`} onClick={onClose} className="hover:underline">
                                                {item.name}
                                            </Link>
                                        </h3>
                                            <p className="ml-4">
                                                <ClientPrice amount={item.price * item.quantity} />
                                            </p>
                                        </div>                                        {item.variantName && (
                                            <p className="mt-1 text-sm text-gray-500">{item.variantName}</p>
                                        )}

                                        {/* Quantity controls and remove button */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-gray-200 rounded-md">
                                                <button
                                                    type="button"
                                                    className="p-1 hover:bg-gray-100 rounded-l-md"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>

                                                <span className="px-2 py-1 w-8 text-center">
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="p-1 hover:bg-gray-100 rounded-r-md"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>                                        <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        setIsLoading(true);
                                                        await removeItem(item.id, item.variantId);
                                                    } catch (error) {
                                                        console.error('Error removing item:', error);
                                                    } finally {
                                                        setIsLoading(false);
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>                {/* Cart footer with subtotal and checkout button */}
                {items.length > 0 && (
                    <div className="border-t p-4">
                        <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                            <p>Subtotal</p>
                            <p><ClientPrice amount={subtotal} /></p>                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Shipping and taxes calculated at checkout.
                        </p><div className="space-y-3">                        <Button
                            className="w-full hover:bg-blue-200"
                            onClick={handleCheckout}
                            disabled={isNavigating || isLoading}
                        >
                            {isNavigating ? "Navigating..." : isLoading ? "Syncing cart..." : "Checkout"}
                        </Button>
                            <Button variant="outline" className="w-full" onClick={onClose}>
                                Continue Shopping
                            </Button>                            <button
                                type="button"
                                onClick={handleClearCart}
                                className="text-sm text-red-600 hover:text-red-800 flex items-center justify-center w-full"
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> Clear cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}