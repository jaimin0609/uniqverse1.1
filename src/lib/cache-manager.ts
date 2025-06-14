import { Redis } from '@upstash/redis';

/**
 * Universal Cache Manager
 * Supports Redis (Upstash) with in-memory fallback
 */

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    compress?: boolean;
    serialize?: boolean;
}

interface CacheEntry {
    value: any;
    expires: number;
    created: number;
}

class CacheManager {
    private redis: any = null;
    private memoryCache = new Map<string, CacheEntry>();
    private isRedisAvailable = false;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.initializeRedis();
        this.startCleanupInterval();
    }

    private initializeRedis() {
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                this.redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
                this.isRedisAvailable = true;
                console.log('🔗 Redis cache initialized with Upstash');
            } else {
                console.log('⚠️ Redis not configured, using memory cache fallback');
            }
        } catch (error) {
            console.warn('⚠️ Redis initialization failed, using memory cache:', error);
            this.isRedisAvailable = false;
        }
    } private startCleanupInterval() {
        // Only setup cleanup in server environment to prevent memory leaks
        if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
            // Clean up expired memory cache entries every 5 minutes
            this.cleanupInterval = setInterval(() => {
                try {
                    this.cleanupMemoryCache();
                } catch (error) {
                    console.warn('Cache manager cleanup failed:', error);
                }
            }, 5 * 60 * 1000);
        }
    }

    private cleanupMemoryCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expires < now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
        }
    }

    private serializeValue(value: any): string {
        try {
            return JSON.stringify(value);
        } catch (error) {
            console.warn('Cache serialization failed:', error);
            return String(value);
        }
    }

    private deserializeValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    }

    async get(key: string): Promise<any> {
        try {
            // Try Redis first
            if (this.isRedisAvailable && this.redis) {
                const value = await this.redis.get(key);
                if (value !== null) {
                    return this.deserializeValue(value);
                }
            }

            // Fallback to memory cache
            const entry = this.memoryCache.get(key);
            if (entry) {
                if (entry.expires > Date.now()) {
                    return entry.value;
                } else {
                    this.memoryCache.delete(key);
                }
            }

            return null;
        } catch (error) {
            console.warn(`Cache get failed for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
        try {
            const serializedValue = this.serializeValue(value);

            // Try Redis first
            if (this.isRedisAvailable && this.redis) {
                await this.redis.setex(key, ttl, serializedValue);
            }

            // Always store in memory cache as fallback
            const expires = Date.now() + (ttl * 1000);
            this.memoryCache.set(key, {
                value,
                expires,
                created: Date.now()
            });

            return true;
        } catch (error) {
            console.warn(`Cache set failed for key ${key}:`, error);
            return false;
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            // Delete from Redis
            if (this.isRedisAvailable && this.redis) {
                await this.redis.del(key);
            }

            // Delete from memory cache
            this.memoryCache.delete(key);

            return true;
        } catch (error) {
            console.warn(`Cache delete failed for key ${key}:`, error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            // Check Redis first
            if (this.isRedisAvailable && this.redis) {
                const exists = await this.redis.exists(key);
                if (exists) return true;
            }

            // Check memory cache
            const entry = this.memoryCache.get(key);
            return entry ? entry.expires > Date.now() : false;
        } catch (error) {
            console.warn(`Cache exists check failed for key ${key}:`, error);
            return false;
        }
    }

    async clear(): Promise<boolean> {
        try {
            // Clear Redis
            if (this.isRedisAvailable && this.redis) {
                await this.redis.flushall();
            }

            // Clear memory cache
            this.memoryCache.clear();

            return true;
        } catch (error) {
            console.warn('Cache clear failed:', error);
            return false;
        }
    }

    async invalidatePattern(pattern: string): Promise<number> {
        try {
            let invalidated = 0;

            // For Redis, use pattern matching
            if (this.isRedisAvailable && this.redis) {
                try {
                    const keys = await this.redis.keys(pattern);
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                        invalidated += keys.length;
                    }
                } catch (error) {
                    console.warn('Redis pattern invalidation failed:', error);
                }
            }

            // For memory cache, manually check each key
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key)) {
                    this.memoryCache.delete(key);
                    invalidated++;
                }
            }

            return invalidated;
        } catch (error) {
            console.warn(`Cache pattern invalidation failed for pattern ${pattern}:`, error);
            return 0;
        }
    }

    async getPattern(pattern: string): Promise<string[]> {
        try {
            const keys: string[] = [];

            // For Redis, use pattern matching
            if (this.isRedisAvailable && this.redis) {
                try {
                    const redisKeys = await this.redis.keys(pattern);
                    keys.push(...redisKeys);
                } catch (error) {
                    console.warn('Redis pattern search failed:', error);
                }
            }

            // For memory cache, manually check each key
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key) && !keys.includes(key)) {
                    keys.push(key);
                }
            }

            return keys;
        } catch (error) {
            console.warn(`Cache pattern search failed for pattern ${pattern}:`, error);
            return [];
        }
    }

    async getMultiple(keys: string[]): Promise<Record<string, any>> {
        const result: Record<string, any> = {};

        try {
            // Try to get all from Redis first
            if (this.isRedisAvailable && this.redis) {
                const values = await this.redis.mget(...keys);
                for (let i = 0; i < keys.length; i++) {
                    if (values[i] !== null) {
                        result[keys[i]] = this.deserializeValue(values[i]);
                    }
                }
            }

            // Fill missing values from memory cache
            for (const key of keys) {
                if (!(key in result)) {
                    const value = await this.get(key);
                    if (value !== null) {
                        result[key] = value;
                    }
                }
            }

            return result;
        } catch (error) {
            console.warn('Cache getMultiple failed:', error);
            return {};
        }
    }

    async setMultiple(entries: Record<string, any>, ttl: number = 300): Promise<boolean> {
        try {
            const promises = Object.entries(entries).map(([key, value]) =>
                this.set(key, value, ttl)
            );

            const results = await Promise.all(promises);
            return results.every(result => result === true);
        } catch (error) {
            console.warn('Cache setMultiple failed:', error);
            return false;
        }
    }

    getStats() {
        return {
            isRedisAvailable: this.isRedisAvailable,
            memoryCacheSize: this.memoryCache.size,
            memoryCacheEntries: Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
                key,
                size: JSON.stringify(entry.value).length,
                expires: new Date(entry.expires).toISOString(),
                created: new Date(entry.created).toISOString()
            }))
        };
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.memoryCache.clear();
    }
}

// Cache invalidation helpers
export const cacheInvalidation = {
    // Admin-related cache invalidation
    onAdminCustomersChange: async () => {
        return await cache.invalidatePattern('admin:customers:*');
    },

    onAdminUsersChange: async () => {
        return await cache.invalidatePattern('admin:users:*');
    },

    onAdminProductsChange: async () => {
        const patterns = [
            'admin:products:*',
            'api:products:*',
            'api:/api/products*'
        ];
        let total = 0;
        for (const pattern of patterns) {
            total += await cache.invalidatePattern(pattern);
        }
        return total;
    },

    onAdminCategoriesChange: async () => {
        const patterns = [
            'admin:categories:*',
            'api:categories:*',
            'api:/api/categories*',
            'api:products:*' // Categories affect product listings
        ];
        let total = 0;
        for (const pattern of patterns) {
            total += await cache.invalidatePattern(pattern);
        }
        return total;
    },

    onAdminOrdersChange: async () => {
        const patterns = [
            'admin:orders:*',
            'admin:stats:*' // Orders affect statistics
        ];
        let total = 0;
        for (const pattern of patterns) {
            total += await cache.invalidatePattern(pattern);
        }
        return total;
    },

    onAdminPagesChange: async () => {
        return await cache.invalidatePattern('admin:pages:*');
    },

    onAdminSupplierOrdersChange: async () => {
        return await cache.invalidatePattern('admin:supplier-orders:*');
    },

    onAdminTicketsChange: async () => {
        return await cache.invalidatePattern('admin:tickets:*');
    },

    // Product-related cache invalidation
    onProductChange: async (productId?: string) => {
        const patterns = [
            'api:products:*',
            'api:/api/products*',
            'admin:products:*'
        ];

        if (productId) {
            patterns.push(`product:${productId}:*`);
        }

        let total = 0;
        for (const pattern of patterns) {
            total += await cache.invalidatePattern(pattern);
        }
        return total;
    },

    // User-related cache invalidation
    onUserChange: async (userId?: string) => {
        const patterns = [
            'admin:users:*',
            'admin:customers:*'
        ];

        if (userId) {
            patterns.push(`user:${userId}:*`);
        }

        let total = 0;
        for (const pattern of patterns) {
            total += await cache.invalidatePattern(pattern);
        }
        return total;
    },

    // Cart-related cache invalidation
    onCartChange: async (userId?: string) => {
        if (userId) {
            return await cache.invalidatePattern(`cart:${userId}:*`);
        }
        return await cache.invalidatePattern('cart:*');
    },

    // Wishlist-related cache invalidation
    onWishlistChange: async (userId?: string) => {
        if (userId) {
            return await cache.invalidatePattern(`wishlist:${userId}:*`);
        }
        return await cache.invalidatePattern('wishlist:*');
    }
};

// Create singleton instance
export const cache = new CacheManager();

// Default export
export default cache;
