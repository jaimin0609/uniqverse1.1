"use client";

import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart";

interface QuickAddToCartProps {
    productId: string;
    productName: string;
    productPrice: number;
    productImage: string;
    className?: string;
    small?: boolean;
}

export function QuickAddToCart({
    productId,
    productName,
    productPrice,
    productImage,
    className = "",
    small = false
}: QuickAddToCartProps) {
    const [isAdding, setIsAdding] = useState(false);
    const { addItem } = useCartStore();

    // Handler for adding to cart
    const handleAddToCart = (e: React.MouseEvent) => {
        // Prevent triggering the parent link/card click
        e.preventDefault();
        e.stopPropagation();

        setIsAdding(true);

        const item: CartItem = {
            id: uuid(), // Generate a unique ID for this cart item
            productId,
            name: productName,
            price: productPrice,
            quantity: 1,
            image: productImage,
        };

        addItem(item);
        toast.success(`Added ${productName} to your cart`);

        // Reset the button after a short delay
        setTimeout(() => {
            setIsAdding(false);
        }, 1500);
    };

    return (
        <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${small ? 'p-1.5 md:p-2' : 'p-2.5 md:p-3'} ${className}`}
            title="Add to cart"
            aria-label="Add to cart"
        >
            {isAdding ? (
                <Check className={small ? "h-4 w-4" : "h-5 w-5"} />
            ) : (
                <ShoppingCart className={small ? "h-4 w-4" : "h-5 w-5"} />
            )}
        </button>
    );
}