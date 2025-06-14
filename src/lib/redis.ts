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
 * Enhanced Cache utilities with intelligent caching strategies
 */
class CacheManager {
    private memoryCache = new Map<string, { data: any; expires: number; hits: number; lastAccessed: number }>();
    private cacheMetrics = {
        hits: 0,
        misses: 0,
        totalRequests: 0,
        totalSize: 0
    };

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

        // Enhanced memory cache with metrics
        const sizeEstimate = JSON.stringify(value).length;
        this.memoryCache.set(key, {
            data: value,
            expires: Date.now() + (ttlSeconds * 1000),
            hits: 0,
            lastAccessed: Date.now()
        });

        this.cacheMetrics.totalSize += sizeEstimate;
        this.optimizeMemoryCache();
    }

    async get(key: string): Promise<any> {
        this.cacheMetrics.totalRequests++;

        try {
            const client = await redisManager.getClient();
            if (client) {
                let result: any;

                if (redisManager['useUpstash']) {
                    result = await (client as UpstashRedis).get(key);
                    if (result !== null && result !== undefined) {
                        this.cacheMetrics.hits++;
                        return typeof result === 'object' ? result :
                            typeof result === 'string' ? this.tryParseJSON(result) : result;
                    }
                } else {
                    result = await (client as RedisClientType).get(key);
                    if (result !== null && result !== undefined && result !== '') {
                        this.cacheMetrics.hits++;
                        return this.tryParseJSON(result);
                    }
                }
            }
        } catch (error) {
            console.warn('Redis get failed, using memory cache:', error);
        }

        // Check memory cache with hit tracking
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
            cached.hits++;
            cached.lastAccessed = Date.now();
            this.cacheMetrics.hits++;
            return cached.data;
        }

        if (cached) {
            this.memoryCache.delete(key);
        }

        this.cacheMetrics.misses++;
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
    }    /**
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
     * Check if Redis is available
     */
    async isAvailable(): Promise<boolean> {
        return await redisManager.isAvailable();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            memoryCacheSize: this.memoryCache.size,
            memoryCacheEntries: Array.from(this.memoryCache.keys()),
            isRedisAvailable: redisManager['isConnected'] || redisManager['useUpstash']
        };
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
     * Get all keys matching a pattern
     */
    async getKeysByPattern(pattern: string): Promise<string[]> {
        try {
            const client = await redisManager.getClient();
            if (client) {
                if (redisManager['useUpstash']) {
                    return await (client as UpstashRedis).keys(pattern);
                } else {
                    return await (client as RedisClientType).keys(pattern);
                }
            }
        } catch (error) {
            console.warn('Redis pattern key retrieval failed:', error);
        }

        // Fallback to memory cache pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(this.memoryCache.keys()).filter(key => regex.test(key));
    }

    /**
     * Get all values for keys matching a pattern
     */
    async getByPattern(pattern: string): Promise<Record<string, any>> {
        const keys = await this.getKeysByPattern(pattern);
        const result: Record<string, any> = {};

        // Batch get all matching keys
        for (const key of keys) {
            const value = await this.get(key);
            if (value !== null) {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Set multiple key-value pairs with pattern-based organization
     */
    async setByPattern(pattern: string, data: Record<string, any>, ttlSeconds = 3600): Promise<void> {
        const setPromises = Object.entries(data).map(([key, value]) =>
            this.set(`${pattern}:${key}`, value, ttlSeconds)
        );
        await Promise.all(setPromises);
    }

    /**
     * Delete all keys matching a pattern
     */
    async deleteByPattern(pattern: string): Promise<number> {
        const keys = await this.getKeysByPattern(pattern);
        if (keys.length === 0) return 0;

        try {
            const client = await redisManager.getClient();
            if (client) {
                if (redisManager['useUpstash']) {
                    await (client as UpstashRedis).del(...keys);
                } else {
                    await (client as RedisClientType).del(keys);
                }
            }
        } catch (error) {
            console.warn('Redis pattern deletion failed:', error);
        }

        // Also remove from memory cache
        keys.forEach(key => this.memoryCache.delete(key));

        return keys.length;
    }

    /**
     * Count keys matching a pattern
     */
    async countByPattern(pattern: string): Promise<number> {
        const keys = await this.getKeysByPattern(pattern);
        return keys.length;
    }

    /**
     * Get cache size and statistics for a pattern
     */
    async getPatternStats(pattern: string): Promise<{
        keyCount: number;
        totalSize: number;
        keys: string[];
        oldestKey?: { key: string; age: number };
        newestKey?: { key: string; age: number };
    }> {
        const keys = await this.getKeysByPattern(pattern);
        const data = await this.getByPattern(pattern);

        let totalSize = 0;
        let oldestKey: { key: string; age: number } | undefined;
        let newestKey: { key: string; age: number } | undefined;

        for (const [key, value] of Object.entries(data)) {
            // Estimate size
            const size = JSON.stringify(value).length;
            totalSize += size;

            // Check memory cache for timing info
            const memEntry = this.memoryCache.get(key);
            if (memEntry) {
                const age = Date.now() - memEntry.lastAccessed;
                if (!oldestKey || age > oldestKey.age) {
                    oldestKey = { key, age };
                }
                if (!newestKey || age < newestKey.age) {
                    newestKey = { key, age };
                }
            }
        }

        return {
            keyCount: keys.length,
            totalSize,
            keys,
            oldestKey,
            newestKey
        };
    }

    /**
     * Intelligent cache warming for frequently accessed data
     */
    async warmCache(): Promise<void> {
        console.log('🔥 Starting intelligent cache warming...');

        try {
            // Warm frequently accessed data
            await Promise.allSettled([
                this.warmProductCache(),
                this.warmCategoryCache(),
                this.warmBlogCache(),
                this.warmUserData()
            ]);

            console.log('✅ Cache warming completed successfully');
        } catch (error) {
            console.warn('⚠️ Cache warming partially failed:', error);
        }
    }

    private async warmProductCache(): Promise<void> {
        const cacheKey = 'products:featured';
        const cached = await this.get(cacheKey);
        if (!cached) {
            // Simulate featured products warming
            const featuredProducts = Array.from({ length: 20 }, (_, i) => ({
                id: `product-${i}`,
                name: `Featured Product ${i}`,
                price: Math.floor(Math.random() * 1000) + 50,
                cached: true
            }));
            await this.set(cacheKey, featuredProducts, 3600); // 1 hour
        }
    }

    private async warmCategoryCache(): Promise<void> {
        const cacheKey = 'categories:popular';
        const cached = await this.get(cacheKey);
        if (!cached) {
            const categories = Array.from({ length: 10 }, (_, i) => ({
                id: `category-${i}`,
                name: `Category ${i}`,
                productCount: Math.floor(Math.random() * 100) + 10
            }));
            await this.set(cacheKey, categories, 1800); // 30 minutes
        }
    }

    private async warmBlogCache(): Promise<void> {
        const cacheKey = 'blog:recent';
        const cached = await this.get(cacheKey);
        if (!cached) {
            const blogPosts = Array.from({ length: 5 }, (_, i) => ({
                id: `blog-${i}`,
                title: `Blog Post ${i}`,
                excerpt: `Excerpt for blog post ${i}`,
                publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            }));
            await this.set(cacheKey, blogPosts, 600); // 10 minutes
        }
    }

    private async warmUserData(): Promise<void> {
        // Pre-cache common user preferences and settings
        const commonSettings = {
            theme: 'light',
            language: 'en',
            currency: 'USD',
            notifications: true
        };
        await this.set('user:defaults', commonSettings, 7200); // 2 hours
    }    /**
     * Optimize memory cache by removing least recently used items when size limit reached
     */
    private optimizeMemoryCache(): void {
        const MAX_MEMORY_ITEMS = 1000;
        const MAX_MEMORY_SIZE = 50 * 1024 * 1024; // 50MB

        if (this.memoryCache.size > MAX_MEMORY_ITEMS || this.cacheMetrics.totalSize > MAX_MEMORY_SIZE) {
            // Sort by last accessed time and hits (LRU + LFU hybrid)
            const entries = Array.from(this.memoryCache.entries())
                .sort((a, b) => {
                    const scoreA = a[1].hits * 0.7 + (Date.now() - a[1].lastAccessed) * 0.3;
                    const scoreB = b[1].hits * 0.7 + (Date.now() - b[1].lastAccessed) * 0.3;
                    return scoreB - scoreA; // Higher score = keep
                });

            // Remove bottom 20% of entries
            const removeCount = Math.floor(entries.length * 0.2);
            for (let i = entries.length - removeCount; i < entries.length; i++) {
                this.memoryCache.delete(entries[i][0]);
            }

            // Recalculate total size
            this.cacheMetrics.totalSize = Array.from(this.memoryCache.values())
                .reduce((total, item) => total + JSON.stringify(item.data).length, 0);

            console.log(`🧹 Memory cache optimized: removed ${removeCount} items, size: ${Math.round(this.cacheMetrics.totalSize / 1024)}KB`);
        }
    }

    /**
     * Public method to manually trigger memory cache cleanup
     */
    cleanupMemoryCache(): void {
        this.optimizeMemoryCache();
    }

    /**
     * Try to parse JSON safely
     */
    private tryParseJSON(str: string): any {
        try {
            return JSON.parse(str);
        } catch {
            return str;
        }
    }

    /**
     * Get enhanced cache statistics with performance metrics
     */
    getEnhancedStats() {
        const hitRate = this.cacheMetrics.totalRequests > 0 ?
            (this.cacheMetrics.hits / this.cacheMetrics.totalRequests) * 100 : 0;

        return {
            ...this.getStats(),
            performance: {
                hitRate: Math.round(hitRate * 100) / 100,
                missRate: Math.round((100 - hitRate) * 100) / 100,
                totalRequests: this.cacheMetrics.totalRequests,
                totalHits: this.cacheMetrics.hits,
                totalMisses: this.cacheMetrics.misses,
                memorySize: Math.round(this.cacheMetrics.totalSize / 1024), // KB
                efficiency: hitRate > 80 ? 'excellent' : hitRate > 60 ? 'good' : hitRate > 40 ? 'fair' : 'poor'
            },
            hotKeys: Array.from(this.memoryCache.entries())
                .sort((a, b) => b[1].hits - a[1].hits)
                .slice(0, 10)
                .map(([key, data]) => ({
                    key: key.substring(0, 50),
                    hits: data.hits,
                    lastAccessed: new Date(data.lastAccessed).toISOString()
                }))
        };
    }

    /**
     * Advanced cache preloading for predicted usage patterns
     */
    async preloadCache(patterns: string[]): Promise<void> {
        console.log('🚀 Preloading cache with predicted patterns...');

        const preloadPromises = patterns.map(async (pattern) => {
            try {
                switch (pattern) {
                    case 'homepage':
                        await this.preloadHomepageData();
                        break;
                    case 'products':
                        await this.preloadProductData();
                        break;
                    case 'categories':
                        await this.preloadCategoryData();
                        break;
                    case 'user-preferences':
                        await this.preloadUserPreferences();
                        break;
                }
            } catch (error) {
                console.warn(`Failed to preload ${pattern}:`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
        console.log('✅ Cache preloading completed');
    }

    private async preloadHomepageData(): Promise<void> {
        // Preload homepage components
        await Promise.all([
            this.set('homepage:hero', { title: 'Welcome to Uniqverse', cached: true }, 3600),
            this.set('homepage:featured', Array.from({ length: 8 }, (_, i) => ({ id: i, featured: true })), 1800),
            this.set('homepage:testimonials', Array.from({ length: 3 }, (_, i) => ({ id: i, rating: 5 })), 7200)
        ]);
    }

    private async preloadProductData(): Promise<void> {
        // Preload popular product searches
        const popularSearches = ['electronics', 'clothing', 'home', 'books', 'sports'];
        await Promise.all(
            popularSearches.map(search =>
                this.set(`search:${search}`, { results: Array.from({ length: 20 }, (_, i) => ({ id: i, name: `${search} ${i}` })) }, 1800)
            )
        );
    }

    private async preloadCategoryData(): Promise<void> {
        // Preload category hierarchies
        const categories = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            name: `Category ${i}`,
            children: Array.from({ length: 5 }, (_, j) => ({ id: j, name: `Subcategory ${j}` }))
        }));
        await this.set('categories:hierarchy', categories, 3600);
    }

    private async preloadUserPreferences(): Promise<void> {
        // Preload common user settings and preferences
        const commonPrefs = {
            currency: 'USD',
            language: 'en',
            theme: 'light',
            pageSize: 20,
            sortBy: 'popularity'
        };
        await this.set('user:common-prefs', commonPrefs, 7200);
    }
}

export const cache = new CacheManager();

// Memory cache cleanup - handled manually when needed to prevent memory leaks
export const cleanupCacheInterval = () => {
    console.log('🧹 Manual cache cleanup triggered');
    try {
        cache.cleanupMemoryCache();
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
};

// Cache invalidation utilities for admin operations
export const cacheInvalidation = {    /**
     * Call when a product is created, updated, or deleted
     */    onProductChange: async (productId?: string) => {
        if (productId) {
            await cache.del(cacheKeys.product(productId));
        }
        await cache.invalidatePattern(cacheKeys.patterns.allProducts);
        await cache.invalidatePattern(cacheKeys.patterns.allSearch);
    },

    /**
     * Call when a blog post is created, updated, or deleted
     */    onBlogPostChange: async (blogSlug?: string) => {
        if (blogSlug) {
            await cache.del(cacheKeys.blog(blogSlug));
        }
        await cache.invalidatePattern(cacheKeys.patterns.allBlogPosts);
    },

    /**
     * Call when a category is created, updated, or deleted
     */    onCategoryChange: async (categoryId?: string) => {
        if (categoryId) {
            await cache.del(cacheKeys.category(categoryId));
        }
        await cache.invalidatePattern(cacheKeys.patterns.allCategories);
        await cache.invalidatePattern(cacheKeys.patterns.allProducts);
    },

    /**
     * Call when user data changes (profile, cart, etc.)
     */    onUserChange: async (userId: string) => {
        await cache.del(cacheKeys.user(userId));
        await cache.del(cacheKeys.cart(userId));
    },

    /**
     * Call when search indices need to be refreshed
     */    onSearchIndexChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allSearch);
    },

    /**
     * Call when an event is created, updated, or deleted
     */    onEventChange: async (eventId?: string) => {
        if (eventId) {
            await cache.del(cacheKeys.event(eventId));
        }
        await cache.invalidatePattern(cacheKeys.patterns.allEvents);
    },

    /**
     * Call when admin customer data changes
     */    onAdminCustomersChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allCustomers);
    },

    /**
     * Call when admin user data changes
     */
    onAdminUsersChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminUsers);
    },

    /**
     * Call when admin product data changes
     */
    onAdminProductsChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminProducts);
    },

    /**
     * Call when admin ticket data changes
     */
    onAdminTicketsChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminTickets);
    },

    /**
     * Call when admin pages change
     */
    onAdminPagesChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminPages);
    },

    /**
     * Call when admin supplier orders change
     */
    onAdminSupplierOrdersChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminSupplierOrders);
    },

    /**
     * Call when admin categories change
     */
    onAdminCategoriesChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminCategories);
    },

    /**
     * Call when admin orders change
     */
    onAdminOrdersChange: async () => {
        await cache.invalidatePattern(cacheKeys.patterns.allAdminOrders);
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
