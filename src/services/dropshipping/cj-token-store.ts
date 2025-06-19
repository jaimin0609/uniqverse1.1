import { cache } from '@/lib/cache-manager';

type TokenData = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number; // timestamp
    refreshTokenExpires: number; // timestamp
    lastUpdated: number; // timestamp
};

type TokenCache = {
    [key: string]: TokenData;
};

/**
 * Utility to manage CJ Dropshipping tokens with Redis cache persistence
 * This works with Vercel's read-only filesystem by using Redis cache
 */
export class CJTokenStore {
    private static instance: CJTokenStore;
    private tokenCache: TokenCache = {};
    private initialized = false;

    private constructor() {
        this.loadTokens();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): CJTokenStore {
        if (!CJTokenStore.instance) {
            CJTokenStore.instance = new CJTokenStore();
        }
        return CJTokenStore.instance;
    }    /**
     * Load tokens from Redis cache
     */    private async loadTokens(): Promise<void> {
        try {
            // Load tokens from Redis cache
            const cachedTokens = await cache.get('cj_dropshipping_tokens');

            if (cachedTokens) {
                // Ensure cachedTokens is a string before parsing
                const tokenString = typeof cachedTokens === 'string' ? cachedTokens : JSON.stringify(cachedTokens);

                // Validate it's not the problematic "[object Object]" string
                if (tokenString === "[object Object]") {
                    console.log('Found corrupted token cache, clearing it');
                    await cache.delete('cj_dropshipping_tokens');
                    this.tokenCache = {};
                } else {
                    try {
                        this.tokenCache = JSON.parse(tokenString);
                        console.log('CJ Dropshipping tokens loaded from cache');
                    } catch (parseError) {
                        console.error('Failed to parse cached tokens, clearing cache:', parseError);
                        await cache.delete('cj_dropshipping_tokens');
                        this.tokenCache = {};
                    }
                }
            } else {
                this.tokenCache = {};
                console.log('No cached CJ Dropshipping tokens found');
            }

            this.initialized = true;
        } catch (error) {
            console.error('Error loading CJ Dropshipping tokens from cache:', error);
            // Clear potentially corrupted cache
            try {
                await cache.delete('cj_dropshipping_tokens');
            } catch (deleteError) {
                console.error('Failed to clear corrupted cache:', deleteError);
            }
            this.tokenCache = {};
            this.initialized = true;
        }
    }/**
     * Save tokens to Redis cache
     */
    private async saveTokens(): Promise<void> {
        try {
            // Save tokens to Redis cache with 7 day expiry
            await cache.set('cj_dropshipping_tokens', JSON.stringify(this.tokenCache), 60 * 60 * 24 * 7);
            console.log('Tokens saved to Redis cache');
        } catch (error) {
            console.error('Error saving CJ Dropshipping tokens to cache:', error);
        }
    }/**
     * Get access token for a supplier
     */
    public async getAccessToken(supplierId: string): Promise<string | null> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        const tokenData = this.tokenCache[supplierId];
        if (!tokenData) {
            return null;
        }

        // Check if token is still valid (at least 10 minutes remaining)
        const now = Date.now();
        const hasValidToken = tokenData.accessTokenExpires > (now + 10 * 60 * 1000);

        if (hasValidToken) {
            return tokenData.accessToken;
        }

        return null;
    }

    /**
     * Get refresh token for a supplier
     */
    public async getRefreshToken(supplierId: string): Promise<string | null> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        const tokenData = this.tokenCache[supplierId];
        if (!tokenData) {
            return null;
        }

        // Check if refresh token is still valid
        const now = Date.now();
        const hasValidRefreshToken = tokenData.refreshTokenExpires > now;

        if (hasValidRefreshToken) {
            return tokenData.refreshToken;
        }

        return null;
    }

    /**
     * Store tokens for a supplier
     */
    public async storeTokens(
        supplierId: string,
        accessToken: string,
        refreshToken: string,
        accessTokenExpires: number,
        refreshTokenExpires: number
    ): Promise<void> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        this.tokenCache[supplierId] = {
            accessToken,
            refreshToken,
            accessTokenExpires,
            refreshTokenExpires,
            lastUpdated: Date.now(),
        };

        await this.saveTokens();
    }

    /**
     * Check if authentication is allowed (respecting rate limits)
     */
    public async canAuthenticate(supplierId: string): Promise<boolean> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        const tokenData = this.tokenCache[supplierId];
        if (!tokenData) {
            return true; // First time authentication is always allowed
        }

        // Check rate limit - only allow one auth request every 5 minutes
        const now = Date.now();
        const timeSinceLastUpdate = now - tokenData.lastUpdated;
        const minTimeBetweenRequests = 5 * 60 * 1000; // 5 minutes in milliseconds

        return timeSinceLastUpdate > minTimeBetweenRequests;
    }

    /**
     * Update last authentication timestamp for rate limiting
     */
    public async updateAuthTimestamp(supplierId: string): Promise<void> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        if (this.tokenCache[supplierId]) {
            this.tokenCache[supplierId].lastUpdated = Date.now();
            await this.saveTokens();
        }
    }

    /**
     * Get wait time until next authentication is allowed
     */
    public async getTimeUntilNextAuth(supplierId: string): Promise<number> {
        // Ensure tokens are loaded
        if (!this.initialized) {
            await this.loadTokens();
        }

        const tokenData = this.tokenCache[supplierId];
        if (!tokenData) {
            return 0; // No data, can authenticate immediately
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - tokenData.lastUpdated;
        const minTimeBetweenRequests = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (timeSinceLastUpdate >= minTimeBetweenRequests) {
            return 0; // Can authenticate now
        }

        return Math.ceil((minTimeBetweenRequests - timeSinceLastUpdate) / 1000);
    }

    /**
     * Clear all cached tokens and rate limit data
     */
    public async clearAllCache(): Promise<void> {
        try {
            await cache.delete('cj_dropshipping_tokens');
            this.tokenCache = {};
            console.log('CJ Dropshipping cache cleared successfully');
        } catch (error) {
            console.error('Error clearing CJ Dropshipping cache:', error);
        }
    }

    /**
     * Clear tokens for a specific supplier
     */
    public async clearSupplierTokens(supplierId: string): Promise<void> {
        if (!this.initialized) {
            await this.loadTokens();
        }

        delete this.tokenCache[supplierId];
        await this.saveTokens();
        console.log(`Cleared tokens for supplier: ${supplierId}`);
    }
}