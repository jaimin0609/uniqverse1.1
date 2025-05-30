import { createClient, RedisClientType } from 'redis';
import { Redis as UpstashRedis } from '@upstash/redis';

class RedisManager {
    private client: RedisClientType | null = null;
    private upstashClient: UpstashRedis | null = null;
    private isConnected = false;
    private useUpstash = false;

    constructor() {
        // Determine which Redis client to use
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            this.useUpstash = true;
            this.upstashClient = new UpstashRedis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            this.isConnected = true; // Upstash REST API doesn't require explicit connection
            console.log('🌐 Using Upstash Redis REST API');
        } else if (process.env.REDIS_URL) {
            this.useUpstash = false;
            console.log('🔌 Using traditional Redis connection');
        } else {
            console.warn('⚠️ No Redis configuration found');
        }
    }

    async getClient(): Promise<RedisClientType | UpstashRedis> {
        if (this.useUpstash && this.upstashClient) {
            return this.upstashClient as any;
        }

        if (!this.client) {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    connectTimeout: 5000,
                },
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis client connected');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Redis client disconnected');
                this.isConnected = false;
            });
        }

        if (!this.isConnected) {
            try {
                await this.client.connect();
                this.isConnected = true;
            } catch (error) {
                console.error('Failed to connect to Redis:', error);
                // In development, we can continue without Redis
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Redis connection failed, continuing without caching');
                    return null as any;
                }
                throw error;
            }
        }

        return this.client;
    }

    async disconnect(): Promise<void> {
        if (this.useUpstash) {
            // Upstash REST API doesn't require explicit disconnection
            console.log('Upstash Redis REST API - no disconnection needed');
            return;
        }

        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            console.log('Redis client disconnected');
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const client = await this.getClient();
            if (!client) return false;

            if (this.useUpstash) {
                // Test Upstash connection
                await (client as UpstashRedis).ping();
            } else {
                // Test traditional Redis connection
                await (client as RedisClientType).ping();
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}

const redisManager = new RedisManager();

export { redisManager as redis };

/**
 * Cache utilities with universal Redis client support
 */
class CacheManager {
    private memoryCache = new Map<string, { data: any; expires: number }>();

    async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                if (redisManager['useUpstash']) {
                    // For Upstash, store the value directly as it handles JSON serialization
                    await (client as UpstashRedis).setex(key, ttlSeconds, value);
                } else {
                    // For traditional Redis, we need to stringify the value
                    let stringValue: string;
                    try {
                        stringValue = JSON.stringify(value);
                    } catch (jsonError) {
                        console.warn(`Failed to stringify value for key "${key}":`, jsonError);
                        throw new Error('JSON serialization failed');
                    }
                    await (client as RedisClientType).setEx(key, ttlSeconds, stringValue);
                }
                return;
            }
        } catch (error) {
            console.warn('Redis set failed, using memory cache:', error);
        }

        // Fallback to memory cache
        this.memoryCache.set(key, {
            data: value,
            expires: Date.now() + (ttlSeconds * 1000)
        });
    }

    async get(key: string): Promise<any> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                let result: any;

                if (redisManager['useUpstash']) {
                    // Upstash Redis REST API returns already-parsed objects
                    result = await (client as UpstashRedis).get(key);
                    
                    // Upstash returns null for non-existent keys, parsed objects for JSON data
                    if (result === null || result === undefined) {
                        return null;
                    }
                    
                    // If it's already an object, return it directly
                    if (typeof result === 'object') {
                        return result;
                    }
                    
                    // If it's a string, try to parse it (for backwards compatibility)
                    if (typeof result === 'string') {
                        try {
                            return JSON.parse(result);
                        } catch (parseError) {
                            console.warn(`Failed to parse JSON string for key "${key}":`, parseError);
                            return result; // Return the raw string
                        }
                    }
                    
                    // For other primitive types, return as-is
                    return result;
                } else {
                    // Traditional Redis returns strings that need parsing
                    result = await (client as RedisClientType).get(key);
                    
                    if (result !== null && result !== undefined && result !== '') {
                        try {
                            return JSON.parse(result);
                        } catch (parseError) {
                            console.warn(`Failed to parse JSON for key "${key}":`, parseError);
                            return null;
                        }
                    }
                    return null;
                }
            }
        } catch (error) {
            console.warn('Redis get failed, using memory cache:', error);
        }

        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }

        if (cached) {
            this.memoryCache.delete(key);
        }

        return null;
    }

    async del(key: string): Promise<void> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                if (redisManager['useUpstash']) {
                    // Upstash Redis command
                    await (client as UpstashRedis).del(key);
                } else {
                    // Traditional Redis command
                    await (client as RedisClientType).del(key);
                }
            }
        } catch (error) {
            console.warn('Redis del failed:', error);
        }

        // Also remove from memory cache
        this.memoryCache.delete(key);
    }

    async flush(): Promise<void> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                if (redisManager['useUpstash']) {
                    // Upstash Redis command
                    await (client as UpstashRedis).flushall();
                } else {
                    // Traditional Redis command
                    await (client as RedisClientType).flushAll();
                }
            }
        } catch (error) {
            console.warn('Redis flush failed:', error);
        }

        // Clear memory cache
        this.memoryCache.clear();
    }

    /**
     * Get or set cache with a factory function
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds = 3600
    ): Promise<T> {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Invalidate cache by pattern (Redis only)
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                let keys: string[];

                if (redisManager['useUpstash']) {
                    // Upstash Redis command
                    keys = await (client as UpstashRedis).keys(pattern);
                } else {
                    // Traditional Redis command
                    keys = await (client as RedisClientType).keys(pattern);
                }

                if (keys.length > 0) {
                    if (redisManager['useUpstash']) {
                        // Upstash Redis command
                        await (client as UpstashRedis).del(...keys);
                    } else {
                        // Traditional Redis command
                        await (client as RedisClientType).del(keys);
                    }
                }
            }
        } catch (error) {
            console.warn('Redis pattern invalidation failed:', error);
        }

        // For memory cache, remove all keys that match the pattern
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
                this.memoryCache.delete(key);
            }
        }
    }

    /**
     * Clean up expired entries from memory cache
     */
    private cleanupMemoryCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }

    /**
     * Invalidate product-related caches
     */
    async invalidateProductCache(productId?: string): Promise<void> {
        if (productId) {
            await this.del(cacheKeys.product(productId));
        }
        await this.invalidatePattern(cacheKeys.patterns.allProducts);
        await this.invalidatePattern(cacheKeys.patterns.allSearch);
    }

    /**
     * Invalidate blog-related caches
     */
    async invalidateBlogCache(blogSlug?: string): Promise<void> {
        if (blogSlug) {
            await this.del(cacheKeys.blog(blogSlug));
        }
        await this.invalidatePattern(cacheKeys.patterns.allBlogPosts);
    }

    /**
     * Invalidate category-related caches
     */
    async invalidateCategoryCache(categoryId?: string): Promise<void> {
        if (categoryId) {
            await this.del(cacheKeys.category(categoryId));
        }
        await this.invalidatePattern(cacheKeys.patterns.allCategories);
        await this.invalidatePattern(cacheKeys.patterns.allProducts);
    }

    /**
     * Invalidate user cart cache
     */
    async invalidateUserCache(userId: string): Promise<void> {
        await this.del(cacheKeys.user(userId));
        await this.del(cacheKeys.cart(userId));
    }

    /**
     * Invalidate all search-related caches
     */
    async invalidateSearchCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allSearch);
    }

    /**
     * Invalidate event-related caches
     */
    async invalidateEventCache(eventId?: string): Promise<void> {
        if (eventId) {
            await this.del(cacheKeys.event(eventId));
        }
        await this.invalidatePattern(cacheKeys.patterns.allEvents);
    }

    /**
     * Invalidate admin-related caches
     */
    async invalidateAdminCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allCustomers);
        await this.invalidatePattern(cacheKeys.patterns.allAdminUsers);
        await this.invalidatePattern(cacheKeys.patterns.allAdminProducts);
        await this.invalidatePattern(cacheKeys.patterns.allAdminTickets);
        await this.invalidatePattern(cacheKeys.patterns.allAdminPages);
        await this.invalidatePattern(cacheKeys.patterns.allAdminSupplierOrders);
    }

    /**
     * Invalidate specific admin cache patterns
     */
    async invalidateAdminCustomersCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allCustomers);
    }

    async invalidateAdminUsersCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminUsers);
    }

    async invalidateAdminProductsCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminProducts);
    }

    async invalidateAdminTicketsCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminTickets);
    }

    async invalidateAdminPagesCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminPages);
    }

    async invalidateAdminSupplierOrdersCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminSupplierOrders);
    }

    async invalidateAdminCategoriesCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminCategories);
    }

    async invalidateAdminOrdersCache(): Promise<void> {
        await this.invalidatePattern(cacheKeys.patterns.allAdminOrders);
    }
}

export const cache = new CacheManager();

// Cleanup memory cache every 5 minutes
setInterval(() => {
    (cache as any).cleanupMemoryCache();
}, 5 * 60 * 1000);

// Cache invalidation utilities for admin operations
export const cacheInvalidation = {
    /**
     * Call when a product is created, updated, or deleted
     */
    onProductChange: async (productId?: string) => {
        await cache.invalidateProductCache(productId);
    },

    /**
     * Call when a blog post is created, updated, or deleted
     */
    onBlogPostChange: async (blogSlug?: string) => {
        await cache.invalidateBlogCache(blogSlug);
    },

    /**
     * Call when a category is created, updated, or deleted
     */
    onCategoryChange: async (categoryId?: string) => {
        await cache.invalidateCategoryCache(categoryId);
    },

    /**
     * Call when user data changes (profile, cart, etc.)
     */
    onUserChange: async (userId: string) => {
        await cache.invalidateUserCache(userId);
    },

    /**
     * Call when search indices need to be refreshed
     */
    onSearchIndexChange: async () => {
        await cache.invalidateSearchCache();
    },

    /**
     * Call when an event is created, updated, or deleted
     */
    onEventChange: async (eventId?: string) => {
        await cache.invalidateEventCache(eventId);
    },

    /**
     * Call when admin customer data changes
     */
    onAdminCustomersChange: async () => {
        await cache.invalidateAdminCustomersCache();
    },

    /**
     * Call when admin user data changes
     */
    onAdminUsersChange: async () => {
        await cache.invalidateAdminUsersCache();
    },

    /**
     * Call when admin product data changes
     */
    onAdminProductsChange: async () => {
        await cache.invalidateAdminProductsCache();
    },

    /**
     * Call when admin ticket data changes
     */
    onAdminTicketsChange: async () => {
        await cache.invalidateAdminTicketsCache();
    },

    /**
     * Call when admin pages change
     */
    onAdminPagesChange: async () => {
        await cache.invalidateAdminPagesCache();
    },

    /**
     * Call when admin supplier orders change
     */
    onAdminSupplierOrdersChange: async () => {
        await cache.invalidateAdminSupplierOrdersCache();
    },

    /**
     * Call when admin categories change
     */
    onAdminCategoriesChange: async () => {
        await cache.invalidateAdminCategoriesCache();
    },

    /**
     * Call when admin orders change
     */
    onAdminOrdersChange: async () => {
        await cache.invalidateAdminOrdersCache();
    },

    /**
     * Full cache flush for major updates
     */
    flushAll: async () => {
        await cache.flush();
    }
};

// Cache key generators
export const cacheKeys = {
    product: (id: string) => `product:${id}`,
    products: (params: string) => `products:${params}`,
    category: (id: string) => `category:${id}`,
    categories: () => 'categories:all',
    search: (query: string, filters: string) => `search:${query}:${filters}`,
    user: (id: string) => `user:${id}`,
    cart: (id: string) => `cart:${id}`,
    blog: (slug: string) => `blog:${slug}`,
    blogList: (params: string) => `blog:list:${params}`,
    blogCategory: (slug: string) => `blog:category:${slug}`,
    suppliers: () => 'suppliers:all',
    suppilerProducts: (supplierId: string, params: string) => `supplier:${supplierId}:products:${params}`,
    event: (id: string) => `event:${id}`,
    events: (params?: string) => params ? `events:${params}` : 'events:all',
    customers: (role: string, search: string, page: number, pageSize: number) => `admin:customers:${role}:${search}:${page}:${pageSize}`,
    // Patterns for cache invalidation
    patterns: {
        allProducts: 'products:*',
        allBlogPosts: 'blog:*',
        allCategories: 'categories:*',
        allSearch: 'search:*',
        userCarts: 'cart:*',
        allEvents: 'events:*',
        allCustomers: 'admin:customers:*',
        allAdminUsers: 'admin:users:*',
        allAdminProducts: 'admin:products:*',
        allAdminTickets: 'admin:tickets:*',
        allAdminPages: 'admin:pages:*',
        allAdminSupplierOrders: 'admin:supplier-orders:*',
        allAdminCategories: 'admin:categories:*',
        allAdminOrders: 'admin:orders:*',
    }
} as const;
