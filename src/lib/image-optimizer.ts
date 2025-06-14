import sharp from 'sharp';
import { cache } from './redis';
import { uploadToCloudinary } from './cloudinary';

/**
 * Advanced Image Optimization System
 * Provides automatic image compression, format conversion, and CDN optimization
 */

export interface ImageOptimizationOptions {
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    progressive?: boolean;
    removeMetadata?: boolean;
}

export interface ImageVariant {
    url: string;
    width: number;
    height: number;
    format: string;
    size: number;
}

export interface OptimizedImageSet {
    original: ImageVariant;
    variants: {
        thumbnail: ImageVariant;
        small: ImageVariant;
        medium: ImageVariant;
        large: ImageVariant;
        webp?: ImageVariant;
        avif?: ImageVariant;
    };
    placeholder: string; // Base64 low-quality placeholder
}

class ImageOptimizer {
    private readonly formats = ['webp', 'avif', 'jpeg'];
    private readonly sizes = {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 }
    };

    /**
     * Process and optimize image with multiple variants
     */
    async processImage(
        imageBuffer: Buffer,
        originalName: string,
        options: ImageOptimizationOptions = {}
    ): Promise<OptimizedImageSet> {
        const cacheKey = `image:processed:${this.hashBuffer(imageBuffer)}`;

        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached as OptimizedImageSet;
        }

        try {
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();

            // Generate placeholder (low quality, small size)
            const placeholder = await this.generatePlaceholder(image);

            // Process original image
            const original = await this.optimizeImage(
                imageBuffer,
                originalName,
                {
                    quality: options.quality || 85,
                    format: options.format || 'jpeg',
                    removeMetadata: true,
                    progressive: true
                }
            );

            // Generate size variants
            const variants: any = {};

            for (const [sizeName, dimensions] of Object.entries(this.sizes)) {
                variants[sizeName] = await this.optimizeImage(
                    imageBuffer,
                    `${sizeName}_${originalName}`,
                    {
                        ...options,
                        width: dimensions.width,
                        height: dimensions.height,
                        fit: 'cover',
                        quality: sizeName === 'thumbnail' ? 70 : 80
                    }
                );
            }

            // Generate modern format variants for the medium size
            if (metadata.width && metadata.width > 300) {
                variants.webp = await this.optimizeImage(
                    imageBuffer,
                    `medium_${originalName}`,
                    {
                        ...options,
                        width: this.sizes.medium.width,
                        height: this.sizes.medium.height,
                        format: 'webp',
                        quality: 80,
                        fit: 'cover'
                    }
                );

                variants.avif = await this.optimizeImage(
                    imageBuffer,
                    `medium_${originalName}`,
                    {
                        ...options,
                        width: this.sizes.medium.width,
                        height: this.sizes.medium.height,
                        format: 'avif',
                        quality: 75,
                        fit: 'cover'
                    }
                );
            } const result: OptimizedImageSet = {
                original,
                variants,
                placeholder
            };

            // Cache the result for 24 hours with timestamp for cleanup
            const cacheData = {
                ...result,
                timestamp: Date.now(),
                originalSize: imageBuffer.length
            };
            await cache.set(cacheKey, cacheData, 86400);

            return result;
        } catch (error) {
            console.error('Image processing failed:', error);
            throw new Error('Failed to process image');
        }
    }

    /**
     * Optimize single image
     */
    private async optimizeImage(
        imageBuffer: Buffer,
        filename: string,
        options: ImageOptimizationOptions
    ): Promise<ImageVariant> {
        let image = sharp(imageBuffer);

        // Resize if dimensions specified
        if (options.width || options.height) {
            image = image.resize({
                width: options.width,
                height: options.height,
                fit: options.fit || 'cover',
                withoutEnlargement: true
            });
        }

        // Remove metadata if requested
        if (options.removeMetadata) {
            image = image.withMetadata();
        }

        // Apply format and quality settings
        switch (options.format) {
            case 'webp':
                image = image.webp({
                    quality: options.quality || 80
                });
                break;
            case 'avif':
                image = image.avif({
                    quality: options.quality || 75
                });
                break;
            case 'png':
                image = image.png({
                    progressive: options.progressive,
                    compressionLevel: 9
                });
                break;
            case 'jpeg':
            default:
                image = image.jpeg({
                    quality: options.quality || 85,
                    progressive: options.progressive || true
                });
                break;
        }

        const optimizedBuffer = await image.toBuffer();
        const metadata = await sharp(optimizedBuffer).metadata();

        // Upload to CDN (Cloudinary)
        const uploadResult = await uploadToCloudinary(
            optimizedBuffer,
            `${filename}.${options.format || 'jpeg'}`,
            {
                folder: 'products',
                transformation: {
                    quality: 'auto',
                    fetch_format: 'auto'
                }
            }
        );

        return {
            url: uploadResult.secure_url,
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: options.format || 'jpeg',
            size: optimizedBuffer.length
        };
    }

    /**
     * Generate low-quality placeholder
     */
    private async generatePlaceholder(image: sharp.Sharp): Promise<string> {
        const placeholderBuffer = await image
            .resize(20, 20, { fit: 'cover' })
            .blur(1)
            .jpeg({ quality: 30 })
            .toBuffer();

        return `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`;
    }

    /**
     * Batch process multiple images
     */
    async batchProcessImages(
        images: { buffer: Buffer; name: string }[],
        options: ImageOptimizationOptions = {}
    ): Promise<OptimizedImageSet[]> {
        const batchSize = 5; // Process 5 images at a time to avoid memory issues
        const results: OptimizedImageSet[] = [];

        for (let i = 0; i < images.length; i += batchSize) {
            const batch = images.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(({ buffer, name }) =>
                    this.processImage(buffer, name, options)
                )
            );

            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Generate responsive image HTML
     */
    generateResponsiveImageHTML(
        imageSet: OptimizedImageSet,
        alt: string,
        className?: string
    ): string {
        const { variants } = imageSet;

        const sources: string[] = [];

        // Add AVIF source if available
        if (variants.avif) {
            sources.push(
                `<source srcset="${variants.avif.url}" type="image/avif">`
            );
        }

        // Add WebP source if available
        if (variants.webp) {
            sources.push(
                `<source srcset="${variants.webp.url}" type="image/webp">`
            );
        }

        // Generate srcset for different sizes
        const srcset = [
            `${variants.small.url} 300w`,
            `${variants.medium.url} 600w`,
            `${variants.large.url} 1200w`
        ].join(', ');

        return `
      <picture ${className ? `class="${className}"` : ''}>
        ${sources.join('\n')}
        <img 
          src="${variants.medium.url}"
          srcset="${srcset}"
          sizes="(max-width: 300px) 300px, (max-width: 600px) 600px, 1200px"
          alt="${alt}"
          loading="lazy"
          style="background-image: url(${imageSet.placeholder}); background-size: cover;"
        />
      </picture>
    `.trim();
    }

    /**
     * Generate Next.js Image component props
     */
    generateNextImageProps(imageSet: OptimizedImageSet) {
        return {
            src: imageSet.variants.medium.url,
            width: imageSet.variants.medium.width,
            height: imageSet.variants.medium.height,
            placeholder: 'blur' as const,
            blurDataURL: imageSet.placeholder,
            sizes: '(max-width: 300px) 300px, (max-width: 600px) 600px, 1200px',
            quality: 85
        };
    }    /**
     * Clean up old cached images
     */
    async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 days
        console.log('Image cache cleanup initiated');

        try {
            // Get all image cache keys
            const imageKeys = await cache.getKeysByPattern('image:*');
            let cleanedCount = 0;

            for (const key of imageKeys) {
                const cached = await cache.get(key);
                if (cached && cached.timestamp) {
                    const age = Date.now() - cached.timestamp;
                    if (age > maxAge) {
                        await cache.del(key);
                        cleanedCount++;
                    }
                }
            }

            console.log(`Cleaned up ${cleanedCount} expired image cache entries`);
            return cleanedCount;
        } catch (error) {
            console.error('Image cache cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Hash buffer for caching
     */
    private hashBuffer(buffer: Buffer): string {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(buffer).digest('hex');
    }    /**
     * Get image optimization statistics
     */
    async getOptimizationStats(): Promise<{
        totalProcessed: number;
        averageCompression: number;
        formatDistribution: Record<string, number>;
        sizeSavings: number;
        cacheStats: any;
    }> {
        try {
            // Get all image cache entries
            const imageData = await cache.getByPattern('image:*');
            const cacheStats = await cache.getPatternStats('image:*');

            let totalProcessed = 0;
            let totalOriginalSize = 0;
            let totalOptimizedSize = 0;
            const formatDistribution: Record<string, number> = {};

            for (const [key, data] of Object.entries(imageData)) {
                if (data && data.original && data.variants) {
                    totalProcessed++;
                    totalOriginalSize += data.original.size || 0;

                    // Calculate optimized size from all variants
                    let variantSize = 0;
                    Object.values(data.variants).forEach((variant: any) => {
                        if (variant && variant.size) {
                            variantSize += variant.size;
                            // Track format distribution
                            const format = variant.format || 'unknown';
                            formatDistribution[format] = (formatDistribution[format] || 0) + 1;
                        }
                    });
                    totalOptimizedSize += variantSize;
                }
            }

            const averageCompression = totalOriginalSize > 0
                ? Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100)
                : 0;

            const sizeSavings = totalOriginalSize - totalOptimizedSize;

            return {
                totalProcessed,
                averageCompression,
                formatDistribution,
                sizeSavings,
                cacheStats: {
                    keyCount: cacheStats.keyCount,
                    totalSize: cacheStats.totalSize,
                    oldestKey: cacheStats.oldestKey,
                    newestKey: cacheStats.newestKey
                }
            };
        } catch (error) {
            console.error('Failed to get optimization stats:', error);
            // Return fallback data
            return {
                totalProcessed: 0,
                averageCompression: 0,
                formatDistribution: {},
                sizeSavings: 0,
                cacheStats: {
                    keyCount: 0,
                    totalSize: 0
                }
            };
        }
    }
}

export const imageOptimizer = new ImageOptimizer();

// Memory-leak safe cleanup - only in server environment  
let imageCleanupInterval: NodeJS.Timeout | null = null;

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    // Cleanup old cached images daily - properly managed interval
    imageCleanupInterval = setInterval(() => {
        try {
            imageOptimizer.cleanupCache();
        } catch (error) {
            console.warn('Image optimizer cleanup failed:', error);
        }
    }, 24 * 60 * 60 * 1000);
}

// Export cleanup function for proper memory management
export const cleanupImageInterval = () => {
    if (imageCleanupInterval) {
        clearInterval(imageCleanupInterval);
        imageCleanupInterval = null;
        console.log('🧹 Image cleanup interval cleared');
    }
};
