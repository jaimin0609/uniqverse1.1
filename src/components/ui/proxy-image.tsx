"use client";

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

type ProxyImageProps = Omit<ImageProps, 'src'> & {
    src: string;
    fallbackSrc?: string;
};

/**
 * ProxyImage component that handles external images safely
 * This works around Next.js image domain restrictions by using a data URL fallback
 * when the original image fails to load
 */
export function ProxyImage({
    src,
    alt,
    fallbackSrc = '/placeholder-image.jpg',
    ...props
}: ProxyImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    // Function to handle image load errors
    const handleError = () => {
        if (!hasError) {
            setImgSrc(fallbackSrc);
            setHasError(true);
        }
    };

    if (!src) {
        return <span className="text-gray-400 text-xs">No image</span>;
    }

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || 'Product image'}
            onError={handleError}
        />
    );
}