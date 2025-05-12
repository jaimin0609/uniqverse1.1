"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "./cart-drawer";

export function CartButton() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { itemCount } = useCartStore();

    // Toggle cart drawer
    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    // Close cart drawer
    const closeCart = () => {
        setIsCartOpen(false);
    };

    return (
        <>
            <button
                onClick={toggleCart}
                className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-label="Open shopping cart"
            >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                        {itemCount}
                    </span>
                )}
            </button>

            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />

            {/* Add animation styles */}
            <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
}