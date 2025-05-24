"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ErrorBoundary } from './error-boundary';

type BlogImageProps = Omit<ImageProps, 'onError'> & {
    fallbackSrc?: string;
};

// List of domains that are already allowed in next.config.js
const ALLOWED_DOMAINS = [
    'localhost',
    'placehold.co',
    'picsum.photos',
    'images.unsplash.com',
    'res.cloudinary.com',
    'cdn.jsdelivr.net',
    'avatars.githubusercontent.com',
    'lh3.googleusercontent.com',
    'uniqverse.u6c4.sg04.idrivee2-96.com',
    'oss-cf.cjdropshipping.com',
    'cf.cjdropshipping.com',
    'img.cjdropshipping.com',
    'cjdropshipping.com',
    'img01.cjdropshipping.com',
    'img02.cjdropshipping.com',
    'img03.cjdropshipping.com',
    'cbu01.alicdn.com',
    'pexels.com',
    'imgur.com',
    'giphy.com',
    'images.pexels.com',
    'googleusercontent.com',
    'cloudinary.com',
    'unsplash.com'
];

// Simple in-memory cache for processed URLs
const urlCache = new Map<string, string>();

// Check if the URL's domain is in our allowed list
const isAllowedDomain = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return ALLOWED_DOMAINS.some(domain =>
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
    } catch (e) {
        return false;
    }
};

// Process the image URL - either use it directly or proxy it
const processImageUrl = (src: string | any): string => {
    if (typeof src !== 'string') return '';

    // Check cache first
    if (urlCache.has(src)) {
        return urlCache.get(src)!;
    }

    // If it's a data URL or relative URL, use it directly
    if (src.startsWith('data:') || src.startsWith('/')) {
        urlCache.set(src, src);
        return src;
    }

    // If it's an allowed domain, use it directly
    if (isAllowedDomain(src)) {
        urlCache.set(src, src);
        return src;
    }

    // Otherwise, proxy the image through our API
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
    urlCache.set(src, proxiedUrl);
    return proxiedUrl;
};

export function BlogImage({
    src,
    alt,
    fallbackSrc = '/images/placeholder-image.svg', // Default fallback image
    ...props
}: BlogImageProps) {
    const [imgSrc, setImgSrc] = useState(() => processImageUrl(src));
    const [useBlurData, setUseBlurData] = useState(true);

    useEffect(() => {
        // Update the image source if it changes
        setImgSrc(processImageUrl(src));
        setUseBlurData(true);
    }, [src]);

    // Function to handle cases where the image fails to load
    const handleError = () => {
        // If the image fails to load, fall back to a regular img tag
        setUseBlurData(false);
    };

    if (!useBlurData) {
        // Use a regular img tag as fallback, which doesn't have domain restrictions
        return (
            <img
                src={typeof imgSrc === 'string' ? imgSrc : fallbackSrc}
                alt={alt as string}
                className={props.className as string}
                style={props.style as React.CSSProperties}
                onError={() => setImgSrc(fallbackSrc as string)}
            />
        );
    }    // Try to use next/Image first
    return (
        <ErrorBoundary fallback={
            <img
                src={fallbackSrc}
                alt={alt as string}
                className={props.className as string}
                style={props.style as React.CSSProperties}
            />
        }>
            <Image
                {...props}
                src={imgSrc}
                alt={alt as string}
                onError={handleError}
            />
        </ErrorBoundary>
    );
}
