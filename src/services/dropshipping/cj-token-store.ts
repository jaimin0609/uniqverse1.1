import { db } from '@/lib/db';

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
 * Utility to manage CJ Dropshipping tokens with database persistence
 * This allows tokens to survive server restarts and works in Vercel's read-only filesystem
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
    }

    /**
     * Load tokens from database
     */
    private async loadTokens(): Promise<void> {
        try {
            // Load tokens from database instead of filesystem
            const suppliers = await db.supplier.findMany({
                where: {
                    type: 'CJ_DROPSHIPPING',
                    NOT: {
                        accessToken: null
                    }
                },
                select: {
                    id: true,
                    accessToken: true,
                    refreshToken: true,
                    tokenExpiresAt: true
                }
            });

            this.tokenCache = {};

            for (const supplier of suppliers) {
                if (supplier.accessToken && supplier.refreshToken && supplier.tokenExpiresAt) {
                    this.tokenCache[supplier.id] = {
                        accessToken: supplier.accessToken,
                        refreshToken: supplier.refreshToken,
                        accessTokenExpires: supplier.tokenExpiresAt.getTime(),
                        refreshTokenExpires: supplier.tokenExpiresAt.getTime() + (7 * 24 * 60 * 60 * 1000), // 7 days
                        lastUpdated: Date.now()
                    };
                }
            }

            console.log('CJ Dropshipping tokens loaded from database');
            this.initialized = true;
        } catch (error) {
            console.error('Error loading CJ Dropshipping tokens:', error);
            this.tokenCache = {};
            this.initialized = true;
        }
    }

    /**
     * Save tokens to database
     */
    private async saveTokens(): Promise<void> {
        try {
            // Save tokens to database instead of filesystem
            for (const [supplierId, tokenData] of Object.entries(this.tokenCache)) {
                await db.supplier.update({
                    where: { id: supplierId },
                    data: {
                        accessToken: tokenData.accessToken,
                        refreshToken: tokenData.refreshToken,
                        tokenExpiresAt: new Date(tokenData.accessTokenExpires)
                    }
                });
            }
        } catch (error) {
            console.error('Error saving CJ Dropshipping tokens:', error);
        }
    }    /**
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
}