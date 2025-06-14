"use client";

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { ErrorBoundary } from './error-boundary';

interface AdvancedImageOptimizationProps extends Omit<ImageProps, 'onError' | 'src'> {
    src: string;
    fallbackSrc?: string;
    enableLazyLoading?: boolean;
    enableWebP?: boolean;
    enableProgressiveLoading?: boolean;
    enableBlurPlaceholder?: boolean;
    quality?: number;
    compressionLevel?: 'low' | 'medium' | 'high' | 'auto';
    sizes?: string;
    preload?: boolean;
    onLoadingComplete?: () => void;
    onError?: () => void;
}

// Image format detection and optimization
const SUPPORTED_FORMATS = ['webp', 'avif', 'jpeg', 'png', 'gif'];
const QUALITY_SETTINGS = {
    low: 60,
    medium: 75,
    high: 90,
    auto: 80
};

// Advanced image optimization cache
const imageCache = new Map<string, {
    optimizedSrc: string;
    format: string;
    size: number;
    timestamp: number;
}>();

// Browser capability detection
let browserSupport: {
    webp: boolean;
    avif: boolean;
    lazyLoading: boolean;
} | null = null;

const detectBrowserSupport = (): Promise<typeof browserSupport> => {
    if (browserSupport) return Promise.resolve(browserSupport);

    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');

        Promise.all([
            // WebP support
            new Promise<boolean>((resolveWebP) => {
                const webpImg = new window.Image();
                webpImg.onload = () => resolveWebP(true);
                webpImg.onerror = () => resolveWebP(false);
                webpImg.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            }),
            // AVIF support
            new Promise<boolean>((resolveAVIF) => {
                const avifImg = new window.Image();
                avifImg.onload = () => resolveAVIF(true);
                avifImg.onerror = () => resolveAVIF(false);
                avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            })
        ]).then(([webp, avif]) => {
            browserSupport = {
                webp,
                avif,
                lazyLoading: 'loading' in HTMLImageElement.prototype
            };
            resolve(browserSupport);
        });
    });
};

// Image optimization utilities
const optimizeImageUrl = (
    src: string,
    options: {
        quality?: number;
        format?: string;
        width?: number;
        height?: number;
    } = {}
): string => {
    try {
        const url = new URL(src, window.location.origin);

        // Add optimization parameters
        if (options.quality) {
            url.searchParams.set('q', options.quality.toString());
        }
        if (options.format) {
            url.searchParams.set('f', options.format);
        }
        if (options.width) {
            url.searchParams.set('w', options.width.toString());
        }
        if (options.height) {
            url.searchParams.set('h', options.height.toString());
        }

        return url.toString();
    } catch {
        return src;
    }
};

const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Create a simple blur pattern
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.1);
};

export function AdvancedImageOptimization({
    src,
    alt,
    fallbackSrc = '/images/placeholder-image.svg',
    enableLazyLoading = true,
    enableWebP = true,
    enableProgressiveLoading = true,
    enableBlurPlaceholder = true,
    quality,
    compressionLevel = 'auto',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    preload = false,
    onLoadingComplete,
    onError,
    width,
    height,
    className,
    ...props
}: AdvancedImageOptimizationProps) {
    const [optimizedSrc, setOptimizedSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [blurDataURL, setBlurDataURL] = useState<string>('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Initialize browser support detection
    useEffect(() => {
        detectBrowserSupport();
    }, []);

    // Generate blur placeholder
    useEffect(() => {
        if (enableBlurPlaceholder && typeof window !== 'undefined') {
            const dataURL = generateBlurDataURL();
            setBlurDataURL(dataURL);
        }
    }, [enableBlurPlaceholder]);

    // Optimize image source based on browser capabilities
    useEffect(() => {
        const optimizeImage = async () => {
            if (!src) return;

            // Check cache first
            const cacheKey = `${src}-${quality}-${compressionLevel}`;
            const cached = imageCache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                setOptimizedSrc(cached.optimizedSrc);
                return;
            }

            let optimizedUrl = src;
            const support = await detectBrowserSupport();

            if (support && enableWebP) {
                const finalQuality = quality || QUALITY_SETTINGS[compressionLevel];

                // Determine best format
                let format = 'jpeg';
                if (support.avif) {
                    format = 'avif';
                } else if (support.webp) {
                    format = 'webp';
                }

                optimizedUrl = optimizeImageUrl(src, {
                    quality: finalQuality,
                    format,
                    width: typeof width === 'number' ? width : undefined,
                    height: typeof height === 'number' ? height : undefined
                });

                // Cache the optimized URL
                imageCache.set(cacheKey, {
                    optimizedSrc: optimizedUrl,
                    format,
                    size: 0, // Would be populated by actual image size
                    timestamp: Date.now()
                });
            }

            setOptimizedSrc(optimizedUrl);
        };

        optimizeImage();
    }, [src, quality, compressionLevel, enableWebP, width, height]);

    // Progressive loading simulation
    useEffect(() => {
        if (!enableProgressiveLoading) return;

        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.random() * 20;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [enableProgressiveLoading, isLoading]);

    // Lazy loading setup
    useEffect(() => {
        if (!enableLazyLoading || !imgRef.current) return;

        const support = browserSupport;

        // Use native lazy loading if supported
        if (support?.lazyLoading) {
            return;
        }

        // Fallback to Intersection Observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observerRef.current?.unobserve(img);
                        }
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [enableLazyLoading, optimizedSrc]);

    // Preload image if needed
    useEffect(() => {
        if (preload && optimizedSrc) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = optimizedSrc;
            document.head.appendChild(link);

            return () => {
                document.head.removeChild(link);
            };
        }
    }, [preload, optimizedSrc]);

    const handleLoad = () => {
        setIsLoading(false);
        setLoadingProgress(100);
        onLoadingComplete?.();
    };

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        setOptimizedSrc(fallbackSrc);
        onError?.();
    };

    // Render loading placeholder
    if (isLoading && enableProgressiveLoading) {
        return (
            <div
                className={`relative overflow-hidden bg-gray-100 ${className || ''}`}
                style={{ width, height }}
            >
                {/* Blur placeholder */}
                {enableBlurPlaceholder && blurDataURL && (
                    <img
                        src={blurDataURL}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
                        aria-hidden="true"
                    />
                )}

                {/* Loading progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                    />
                </div>

                {/* Loading spinner */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
            </div>
        );
    }

    // Fallback for browsers without Next.js Image support
    if (hasError || !optimizedSrc) {
        return (
            <img
                ref={imgRef}
                src={fallbackSrc}
                alt={alt}
                className={className}
                style={{ width, height }}
                onError={handleError}
                {...(enableLazyLoading && !browserSupport?.lazyLoading && {
                    'data-src': optimizedSrc,
                    src: blurDataURL || fallbackSrc
                })}
            />
        );
    }

    // Main optimized image component
    return (
        <ErrorBoundary
            fallback={
                <img
                    src={fallbackSrc}
                    alt={alt}
                    className={className}
                    style={{ width, height }}
                />
            }
        >
            <Image
                {...props}
                ref={imgRef}
                src={optimizedSrc}
                alt={alt}
                width={width}
                height={height}
                className={className}
                sizes={sizes}
                quality={quality || QUALITY_SETTINGS[compressionLevel]}
                placeholder={enableBlurPlaceholder && blurDataURL ? 'blur' : undefined}
                blurDataURL={enableBlurPlaceholder ? blurDataURL : undefined}
                loading={enableLazyLoading ? 'lazy' : 'eager'}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: isLoading ? 0 : 1,
                    ...props.style
                }}
            />
        </ErrorBoundary>
    );
}

// Performance monitoring for images
export const imagePerformanceMonitor = {
    metrics: new Map<string, {
        loadTime: number;
        size: number;
        format: string;
        cached: boolean;
    }>(),

    recordMetric(src: string, loadTime: number, size: number, format: string, cached: boolean) {
        this.metrics.set(src, { loadTime, size, format, cached });
    },

    getStats() {
        const metrics = Array.from(this.metrics.values());
        return {
            totalImages: metrics.length,
            averageLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length || 0,
            totalSize: metrics.reduce((sum, m) => sum + m.size, 0),
            cacheHitRate: (metrics.filter(m => m.cached).length / metrics.length) * 100 || 0,
            formatDistribution: metrics.reduce((acc, m) => {
                acc[m.format] = (acc[m.format] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };
    },

    clear() {
        this.metrics.clear();
    }
};

export default AdvancedImageOptimization;
