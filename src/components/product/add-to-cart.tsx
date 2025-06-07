"use client";

import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/store/cart";
import { ClientPrice } from "@/components/ui/client-price";
import { VariantSelectors } from "@/components/product/variant-selectors";

interface ProductVariant {
    id: string;
    name?: string | null;
    price: number;
    image?: string | null;
    options?: string | null;
    type?: string | null;
}

interface AddToCartProps {
    productId: string;
    productSlug: string; // Added slug for proper cart URLs
    productName: string;
    productPrice: number;
    productImage: string;
    productStock: number;
    variants?: ProductVariant[];
    onVariantChange?: (variantId: string) => void;
    customDesignData?: string | null;
    customPreviewUrl?: string | null;
    finalPrice?: number;
}

export function AddToCart({
    productId,
    productSlug,
    productName,
    productPrice,
    productImage,
    productStock,
    variants = [],
    onVariantChange,
    customDesignData,
    customPreviewUrl,
    finalPrice,
}: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        variants.length > 0 ? variants[0].id : null
    );
    const { addItem } = useCartStore();

    // Find the selected variant
    const selectedVariant = variants.find(
        (variant) => variant.id === selectedVariantId
    );    // Determine the price to use (variant price or product price, plus customization)
    const basePrice = selectedVariant ? selectedVariant.price : productPrice;
    const price = finalPrice || basePrice;

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
    };    // Handler for variant selection
    const handleVariantChange = (variantId: string) => {
        if (!variantId) {
            console.warn("Invalid variant ID received");
            return;
        }

        console.log("AddToCart: Variant selected:", variantId);
        // Only update the state if it's actually changing
        if (variantId !== selectedVariantId) {
            setSelectedVariantId(variantId);
            onVariantChange?.(variantId);
        }
    };    // Handler for adding to cart
    const handleAddToCart = () => {
        if (productStock <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        // Use variant image if available, otherwise use custom preview or product image
        const variantImage = selectedVariant?.image || customPreviewUrl || productImage;

        // Prepare customizations data if any
        const customizations = customDesignData ? {
            designData: customDesignData,
            previewUrl: customPreviewUrl,
            additionalPrice: (finalPrice || basePrice) - basePrice
        } : undefined;

        const item: CartItem = {
            id: uuid(), // Generate a unique ID for this cart item
            productId,
            slug: productSlug, // Added slug for proper URLs
            name: productName,
            price,
            quantity,
            image: variantImage,
            variantId: selectedVariantId || undefined,
            variantName: selectedVariant?.name || undefined,
            customizations,
        };

        addItem(item);
        toast.success(`Added ${quantity} ${quantity > 1 ? "items" : "item"} to your cart`);
    }; return (
        <div className="space-y-4">
            {/* Variant Selectors */}
            {variants.length > 0 && (
                <VariantSelectors
                    variants={variants}
                    selectedVariantId={selectedVariantId}
                    onVariantChange={handleVariantChange}
                />
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
                {/* Quantity Selector */}                <div className="flex-grow max-w-[150px]">
                    <div className="flex h-12 border border-gray-300 rounded-md overflow-hidden flex-nowrap">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="flex-none w-12 flex items-center justify-center text-gray-600 text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            -
                        </button>                        <input
                            type="number"
                            min="1"
                            max={productStock}
                            value={quantity}
                            onChange={handleInputChange}
                            className="flex-grow w-full text-center focus:outline-none"
                            style={{ appearance: 'none', MozAppearance: 'textfield' }}
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