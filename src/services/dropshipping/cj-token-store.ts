import fs from 'fs';
import path from 'path';

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

const TOKEN_FILE_PATH = path.join(process.cwd(), '.cj-tokens.json');

/**
 * Utility to manage CJ Dropshipping tokens with filesystem persistence
 * This allows tokens to survive server restarts
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
     * Load tokens from file system
     */
    private loadTokens(): void {
        try {
            if (fs.existsSync(TOKEN_FILE_PATH)) {
                const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
                this.tokenCache = JSON.parse(data);
                console.log('CJ Dropshipping tokens loaded from file');
            } else {
                this.tokenCache = {};
                console.log('No CJ Dropshipping token file found, creating new cache');
            }
            this.initialized = true;
        } catch (error) {
            console.error('Error loading CJ Dropshipping tokens:', error);
            this.tokenCache = {};
            this.initialized = true;
        }
    }

    /**
     * Save tokens to file system
     */
    private saveTokens(): void {
        try {
            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(this.tokenCache, null, 2));
        } catch (error) {
            console.error('Error saving CJ Dropshipping tokens:', error);
        }
    }

    /**
     * Get access token for a supplier
     */
    public getAccessToken(supplierId: string): string | null {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
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
    public getRefreshToken(supplierId: string): string | null {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
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
    public storeTokens(
        supplierId: string,
        accessToken: string,
        refreshToken: string,
        accessTokenExpires: number,
        refreshTokenExpires: number
    ): void {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
        }

        this.tokenCache[supplierId] = {
            accessToken,
            refreshToken,
            accessTokenExpires,
            refreshTokenExpires,
            lastUpdated: Date.now(),
        };

        this.saveTokens();
    }

    /**
     * Check if authentication is allowed (respecting rate limits)
     */
    public canAuthenticate(supplierId: string): boolean {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
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
    public updateAuthTimestamp(supplierId: string): void {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
        }

        if (this.tokenCache[supplierId]) {
            this.tokenCache[supplierId].lastUpdated = Date.now();
            this.saveTokens();
        }
    }

    /**
     * Get wait time until next authentication is allowed
     */
    public getTimeUntilNextAuth(supplierId: string): number {
        // Ensure tokens are loaded
        if (!this.initialized) {
            this.loadTokens();
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