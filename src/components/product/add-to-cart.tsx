"use client";

import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/store/cart";

interface ProductVariant {
    id: string;
    name?: string | null;
    price: number;
}

interface AddToCartProps {
    productId: string;
    productName: string;
    productPrice: number;
    productImage: string;
    productStock: number;
    variants?: ProductVariant[];
}

export function AddToCart({
    productId,
    productName,
    productPrice,
    productImage,
    productStock,
    variants = [],
}: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        variants.length > 0 ? variants[0].id : null
    );
    const { addItem } = useCartStore();

    // Find the selected variant
    const selectedVariant = variants.find(
        (variant) => variant.id === selectedVariantId
    );

    // Determine the price to use (variant price or product price)
    const price = selectedVariant ? selectedVariant.price : productPrice;

    // Handler for quantity adjustments
    const handleQuantityChange = (amount: number) => {
        const newQuantity = quantity + amount;
        if (newQuantity >= 1 && newQuantity <= productStock) {
            setQuantity(newQuantity);
        }
    };

    // Handler for direct quantity input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1 && value <= productStock) {
            setQuantity(value);
        }
    };

    // Handler for variant selection
    const handleVariantChange = (variantId: string) => {
        setSelectedVariantId(variantId);
    };

    // Handler for adding to cart
    const handleAddToCart = () => {
        if (productStock <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        const item: CartItem = {
            id: uuid(), // Generate a unique ID for this cart item
            productId,
            name: productName,
            price,
            quantity,
            image: productImage,
            variantId: selectedVariantId || undefined,
            variantName: selectedVariant?.name || undefined,
        };

        addItem(item);
        toast.success(`Added ${quantity} ${quantity > 1 ? "items" : "item"} to your cart`);
    };

    return (
        <div className="space-y-4">
            {/* Variants Selection */}
            {variants.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Variant:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {variants.map((variant) => (
                            <button
                                key={variant.id}
                                onClick={() => handleVariantChange(variant.id)}
                                className={`p-2 border rounded-md text-sm ${selectedVariantId === variant.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                type="button"
                            >
                                <span className="block font-medium truncate">
                                    {variant.name || "Default"}
                                </span>
                                <span className="block text-gray-500">${variant.price.toFixed(2)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
                {/* Quantity Selector */}
                <div className="flex-grow max-w-[150px]">
                    <div className="flex h-12 border border-gray-300 rounded-md overflow-hidden">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="flex-none w-12 flex items-center justify-center text-gray-600 text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            min="1"
                            max={productStock}
                            value={quantity}
                            onChange={handleInputChange}
                            className="flex-grow text-center focus:outline-none"
                            aria-label="Product quantity"
                        />
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= productStock}
                            className="flex-none w-12 flex items-center justify-center text-gray-600 text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                    onClick={handleAddToCart}
                    className="h-12 flex-grow text-base"
                    disabled={productStock <= 0}
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {productStock <= 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
            </div>

            {/* Stock Information */}
            {productStock > 0 && productStock <= 10 && (
                <p className="text-sm text-amber-600">
                    Only {productStock} left in stock - order soon
                </p>
            )}
        </div>
    );
}