'use client';

import { useState, useCallback } from 'react';
import { ProductImageGallery } from '@/components/product/product-image-gallery';
import { AddToCart } from '@/components/product/add-to-cart';
import { WishlistButton } from '@/components/product/wishlist-button';
import { SocialShareButtons } from '@/components/ui/social-share';
import { Star, Check, Info, Truck, ArrowLeft } from 'lucide-react';
import { ClientPrice } from '@/components/ui/client-price';
import { useCurrency } from '@/contexts/currency-provider';
import { getFreeShippingThresholdMessage } from '@/utils/shipping';

interface ProductImage {
    id: string;
    url: string;
    alt: string | null;
}

interface ProductVariant {
    id: string;
    name: string;
    price: number;
    image?: string | null | undefined;
    options?: string | null;
    type?: string | null;
}

interface ProductDetailClientProps {
    productId: string;
    productSlug: string; // Added slug for cart URLs
    productName: string;
    productPrice: number;
    productCompareAtPrice?: number | null;
    productStock: number;
    images: ProductImage[];
    variants: ProductVariant[]; averageRating: number;
    reviewCount: number;
    description?: string | null;
}

export function ProductDetailClient({
    productId,
    productSlug,
    productName,
    productPrice,
    productCompareAtPrice,
    productStock,
    images,
    variants,
    averageRating, reviewCount,
    description
}: ProductDetailClientProps) {
    const { currency, exchangeRates } = useCurrency();
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        variants.length > 0 ? variants[0].id : null
    ); const [currentProductImage, setCurrentProductImage] = useState<string>(
        images[0]?.url || '/placeholder-product.jpg'
    );// Handler for variant changes from AddToCart component
    const handleVariantChange = useCallback((variantId: string) => {
        if (!variantId) {
            console.warn("Invalid variant ID received in ProductDetailClient");
            return;
        }

        setSelectedVariantId(variantId);

        // Find the selected variant and update image if it has one
        const selectedVariant = variants.find(v => v.id === variantId);

        if (selectedVariant) {
            if (selectedVariant.image) {
                try {
                    // Validate the URL before setting it
                    new URL(selectedVariant.image);
                    setCurrentProductImage(selectedVariant.image);
                } catch (error) {
                    console.warn("Invalid variant image URL:", selectedVariant.image, error);
                    // Fallback to first product image if variant image URL is invalid
                    setCurrentProductImage(images[0]?.url || '/placeholder-product.jpg');
                }
            } else {
                // Fallback to first product image if variant has no image
                setCurrentProductImage(images[0]?.url || '/placeholder-product.jpg');
            }
        } else {
            // If no matching variant (shouldn't happen), fallback to default image
            setCurrentProductImage(images[0]?.url || '/placeholder-product.jpg');
        }
    }, [variants, images]);    // Handler for image changes from gallery
    const handleImageChange = useCallback((imageUrl: string) => {
        setCurrentProductImage(imageUrl);
    }, []);

    // Calculate final price
    const finalPrice = productPrice; return (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left side - Scrollable Images and Description */}            <div className="flex-1 lg:max-w-2xl">
                {/* Product Images */}
                <div className="mb-8">
                    <ProductImageGallery
                        images={images}
                        productName={productName}
                        variants={variants.map(variant => ({
                            id: variant.id,
                            name: variant.name,
                            image: variant.image || null
                        }))}
                        selectedVariantId={selectedVariantId || undefined}
                        onVariantImageChange={handleImageChange}
                    />
                </div>

                {/* Product Description */}
                <div className="prose max-w-none mt-8">
                    <h2 className="text-xl font-semibold mb-4">Product Description</h2>
                    {typeof description === 'string' ? (
                        <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />
                    ) : (
                        <div className="text-gray-600 leading-relaxed">{description || 'No description available.'}</div>
                    )}
                </div>
            </div>

            {/* Right side - Sticky Product Details with Separate Scrolling */}
            <div className="lg:w-96 lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-6rem)]">
                <div className="bg-white lg:border lg:rounded-lg lg:p-6 lg:shadow-sm h-full lg:overflow-y-auto space-y-6">
                    {/* Product Header */}
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-3">{productName}</h1>
                        <div className="flex items-center space-x-4 mb-4">
                            {/* Rating */}
                            <div className="flex items-center">
                                <div className="flex items-center mr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            fill={star <= Math.round(averageRating) ? "currentColor" : "none"}
                                            className={star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {averageRating} ({reviewCount} reviews)
                                </span>
                            </div>

                            {/* Stock Status */}
                            {productStock > 0 ? (
                                <span className="inline-flex items-center text-sm text-green-600">
                                    <Check size={16} className="mr-1" /> In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-sm text-red-600">
                                    <Info size={16} className="mr-1" /> Out of Stock
                                </span>
                            )}
                        </div>
                    </div>                    {/* Price */}
                    <div className="border-t pt-4">                        <div className="flex items-center">
                        {productCompareAtPrice && (
                            <span className="text-lg text-gray-500 line-through mr-3">
                                <ClientPrice amount={Number(productCompareAtPrice)} />
                            </span>
                        )}
                        <span className="text-2xl lg:text-3xl font-bold text-gray-900">
                            <ClientPrice amount={finalPrice} />
                        </span>
                        {productCompareAtPrice && (
                            <span className="ml-3 inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md">
                                {Math.round((1 - finalPrice / Number(productCompareAtPrice)) * 100)}% OFF
                            </span>
                        )}
                    </div>
                    </div>                    {/* Add to Cart Component */}                    <div className="border-t pt-4">                        <AddToCart
                        productId={productId}
                        productSlug={productSlug} // Added slug for cart URLs
                        productName={productName}
                        productPrice={productPrice}
                        productImage={currentProductImage}
                        productStock={productStock} variants={variants.map(variant => ({
                            id: variant.id,
                            name: variant.name,
                            price: variant.price,
                            image: variant.image,
                            options: variant.options,
                            type: variant.type
                        }))}
                        onVariantChange={handleVariantChange}
                        finalPrice={finalPrice}
                    />
                    </div>

                    {/* Wishlist */}
                    <div className="flex items-center justify-center py-2">
                        <WishlistButton
                            productId={productId}
                            productName={productName}
                        />
                        <span className="ml-2 text-sm text-gray-600">Add to wishlist</span>
                    </div>                    {/* Shipping & Returns */}
                    <div className="border-t pt-4 text-sm text-gray-600 space-y-3">
                        <div className="flex space-x-3">
                            <Truck className="flex-shrink-0 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Free Shipping</p>
                                <p>{getFreeShippingThresholdMessage(currency, exchangeRates)}</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <ArrowLeft className="flex-shrink-0 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Easy Returns</p>
                                <p>30-day return policy</p>
                            </div>
                        </div>
                    </div>

                    {/* Social Sharing */}
                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-3">Share this product</p>
                        <SocialShareButtons
                            title={productName}
                            description={typeof description === 'string' ?
                                description.replace(/<[^>]*>/g, '').slice(0, 160) :
                                `Check out ${productName} on UniQVerse`
                            }
                            image={currentProductImage}
                            hashtags={['UniQVerse', 'Shopping', 'Product']}
                            className="justify-start"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
