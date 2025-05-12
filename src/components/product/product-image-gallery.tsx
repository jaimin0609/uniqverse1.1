'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImage {
    id: string;
    url: string;
    alt: string | null;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    // Ensure we have images before setting state
    const [selectedImage, setSelectedImage] = useState<string>(images[0]?.url || '/placeholder-product.jpg');
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    // Debug log to check the images prop
    console.log("Product images:", images);

    const handleImageSelect = (imageUrl: string, index: number) => {
        console.log("Selected image:", imageUrl);
        setSelectedImage(imageUrl);
        setSelectedIndex(index);
    };

    const handleNext = () => {
        if (images.length <= 1) return;

        const nextIndex = (selectedIndex + 1) % images.length;
        setSelectedIndex(nextIndex);
        setSelectedImage(images[nextIndex].url);
    };

    const handlePrevious = () => {
        if (images.length <= 1) return;

        const prevIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
        setSelectedIndex(prevIndex);
        setSelectedImage(images[prevIndex].url);
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
                />
                {images.length > 1 && (
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
                            {images.map((_, index) => (
                                <span
                                    key={`indicator-${index}`}
                                    className={`h-1.5 rounded-full transition-all ${index === selectedIndex
                                            ? 'w-4 bg-white'
                                            : 'w-1.5 bg-white/50'
                                        }`}
                                    onClick={() => handleImageSelect(images[index].url, index)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`aspect-square relative rounded-md overflow-hidden border cursor-pointer ${selectedIndex === index ? 'ring-2 ring-blue-500' : ''
                                }`}
                            onClick={() => handleImageSelect(image.url, index)}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || productName}
                                fill
                                className="object-cover hover:opacity-80 transition-opacity"
                                sizes="(max-width: 768px) 25vw, 15vw"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
