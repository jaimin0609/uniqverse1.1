'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImage {
    id: string;
    url: string;
    alt: string | null;
}

interface ProductVariant {
    id: string;
    name: string;
    image: string | null;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
    variants?: ProductVariant[];
    selectedVariantId?: string;
    onVariantImageChange?: (imageUrl: string) => void;
}

// Helper function to safely validate and process URLs
const isValidUrl = (url: string): boolean => {
    // Basic URL format check before trying the URL constructor
    if (!url || typeof url !== 'string') return false;

    // Check if it's a relative URL
    if (url.startsWith('/')) return true;

    // Check for basic URL structure
    const pattern = /^(https?:\/\/)/i;
    if (!pattern.test(url)) return false;

    try {
        new URL(url);
        return true;
    } catch (error) {
        console.warn("Invalid URL format:", url);
        return false;
    }
};

// Helper function to process image URLs
const processImageUrl = (url: string): string => {
    // Handle empty or undefined URLs
    if (!url || typeof url !== 'string') return '/placeholder-product.jpg';

    // For relative URLs, keep as is
    if (url.startsWith('/')) {
        return url;
    }

    // If it's already a valid URL with http/https, return it directly
    if (isValidUrl(url)) {
        return url;
    }

    // Handle URLs that might be missing protocol
    if (url.includes('.') && !url.startsWith('http')) {
        const withProtocol = `https://${url}`;
        if (isValidUrl(withProtocol)) {
            return withProtocol;
        }
    }

    // For potentially external URLs that failed validation, try to proxy them
    try {
        // Clean the URL before proxying
        const cleanUrl = url.trim();
        return `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`;
    } catch (error) {
        console.warn("Failed to process image URL:", url);
        return '/placeholder-product.jpg';
    }
};

export function ProductImageGallery({
    images,
    productName,
    variants = [],
    selectedVariantId,
    onVariantImageChange
}: ProductImageGalleryProps) {
    // Get all available images (product images + variant images) - memoized to avoid unnecessary recalculations
    const allImages = useMemo(() => [
        ...images,
        ...variants
            .filter(v => v.image)
            .map(v => {
                // Instead of strict URL validation, process the URL safely
                const processedUrl = processImageUrl(v.image!);
                return {
                    id: `variant-${v.id}`,
                    url: processedUrl,
                    alt: `${productName} - ${v.name}`
                };
            })
    ], [images, variants, productName]);

    // Ensure we have images before setting state
    const [selectedImage, setSelectedImage] = useState<string>(allImages[0]?.url || '/placeholder-product.jpg');
    const [selectedIndex, setSelectedIndex] = useState<number>(0);    // Update image when variant changes
    useEffect(() => {
        if (selectedVariantId && variants.length > 0) {
            const selectedVariant = variants.find(v => v.id === selectedVariantId);
            if (selectedVariant?.image) {
                console.log("Found variant image:", selectedVariant.image);
                // Process the image URL safely
                const processedUrl = processImageUrl(selectedVariant.image);
                console.log("Processed URL:", processedUrl);

                // Find the variant image in our processed images array
                const variantImageIndex = allImages.findIndex(img =>
                    img.id === `variant-${selectedVariant.id}`
                );

                console.log("Variant image index:", variantImageIndex);

                if (variantImageIndex !== -1) {
                    setSelectedImage(allImages[variantImageIndex].url);
                    setSelectedIndex(variantImageIndex);
                    onVariantImageChange?.(allImages[variantImageIndex].url);
                } else {
                    // If not found (edge case), add it dynamically
                    setSelectedImage(processedUrl);
                    onVariantImageChange?.(processedUrl);
                }
            }
        }
    }, [selectedVariantId, variants, allImages, onVariantImageChange]);

    const handleImageSelect = (imageUrl: string, index: number) => {
        setSelectedImage(imageUrl);
        setSelectedIndex(index);
        onVariantImageChange?.(imageUrl);
    };

    const handleNext = () => {
        if (allImages.length <= 1) return;

        const nextIndex = (selectedIndex + 1) % allImages.length;
        setSelectedIndex(nextIndex);
        setSelectedImage(allImages[nextIndex].url);
        onVariantImageChange?.(allImages[nextIndex].url);
    };

    const handlePrevious = () => {
        if (allImages.length <= 1) return;

        const prevIndex = selectedIndex === 0 ? allImages.length - 1 : selectedIndex - 1;
        setSelectedIndex(prevIndex);
        setSelectedImage(allImages[prevIndex].url);
        onVariantImageChange?.(allImages[prevIndex].url);
    };

    return (
        <div className="space-y-4">
            <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border group">
                <Image
                    src={selectedImage}
                    alt={productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onError={(e) => {
                        // If image fails to load, set fallback
                        e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                />
                {allImages.length > 1 && (
                    <>
                        {/* Previous Button */}
                        <button
                            onClick={handlePrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 shadow-md opacity-75 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
                        </button>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 shadow-md opacity-75 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
                        </button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
                            {allImages.map((_, index) => (
                                <span
                                    key={`indicator-${index}`}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${index === selectedIndex
                                        ? 'w-4 bg-white'
                                        : 'w-1.5 bg-white/50'
                                        }`}
                                    onClick={() => handleImageSelect(allImages[index].url, index)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {allImages.map((image, index) => (
                        <div
                            key={image.id}
                            className={`aspect-square relative rounded-md overflow-hidden border cursor-pointer transition-all hover:border-blue-300 ${selectedIndex === index ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                                }`}
                            onClick={() => handleImageSelect(image.url, index)}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || productName}
                                fill
                                className="object-cover hover:opacity-80 transition-opacity"
                                sizes="(max-width: 768px) 25vw, 15vw"
                                onError={(e) => {
                                    // If thumbnail fails to load, use fallback
                                    e.currentTarget.src = '/placeholder-product.jpg';
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
