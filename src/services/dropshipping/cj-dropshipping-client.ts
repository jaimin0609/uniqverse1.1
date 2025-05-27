import { CJTokenStore } from './cj-token-store';
import { SupplierOrderData, SupplierOrderResponse, SupplierOrderStatusResponse } from './supplier-api-client';

/**
 * CJ Dropshipping API Client
 * Complete implementation based on CJ Dropshipping API documentation:
 * https://developers.cjdropshipping.com/en/api/api2/api/product.html
 */
export class CJDropshippingApiClient {
    private readonly apiKey: string;
    private readonly apiEndpoint: string; private readonly supplierId: string;
    private tokenStore: CJTokenStore;

    // Cache for categories to reduce API calls
    private categoryCache: any = null;
    private categoryCacheTimestamp: number = 0;
    private readonly CATEGORY_CACHE_TTL = 3600000; // 1 hour in milliseconds

    constructor(apiKey: string, apiEndpoint: string, supplierId: string) {
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint.endsWith('/') ? apiEndpoint : apiEndpoint + '/';
        this.supplierId = supplierId;
        this.tokenStore = CJTokenStore.getInstance();
    }/**
     * Utility method to format product IDs
     * CJ Dropshipping API expects product IDs in the format "pid:NUMBER:null"
     * rather than just the numeric part
     */    private formatProductId(pid: string): string {
        console.log(`Original product ID: ${pid}`);

        // First priority: Extract the numeric part using regex pattern
        // This is the most robust approach that will work regardless of format
        const numericMatch = pid.match(/(\d+)/);
        if (numericMatch && numericMatch[1]) {
            const numericPart = numericMatch[1];
            const formattedId = `pid:${numericPart}:null`;
            console.log(`Extracted numeric part and formatted ID to: ${formattedId}`);
            return formattedId;
        }

        // Fallbacks for specific patterns if regex extraction fails

        // ENHANCED FIX: Check for double-prefixed IDs like "pid:pid:NUMBER:null" 
        if (pid.startsWith('pid:pid:')) {
            const parts = pid.split(':');
            // For the pattern pid:pid:NUMBER:null, extract the NUMBER part
            if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
                const formattedId = `pid:${parts[2]}:null`;
                console.log(`Fixed double-prefix in product ID: ${formattedId}`);
                return formattedId;
            }
        } else if (pid.startsWith('pid:')) {
            const parts = pid.split(':');
            // Extract the numeric part (should be at index 1 for regular pid:NUMBER:null format)
            if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                const formattedId = `pid:${parts[1]}:null`;
                console.log(`Normalized product ID format: ${formattedId}`);
                return formattedId;
            }
        }

        // If it's already in the expected format, keep it as is
        if (/^pid:\d+:null$/.test(pid)) {
            console.log(`Product ID already in correct format: ${pid}`);
            return pid;
        }

        // If it's in the format "pid:number", add ":null"
        if (/^pid:\d+$/.test(pid)) {
            const formattedId = `${pid}:null`;
            console.log(`Formatted product ID: ${formattedId}`);
            return formattedId;
        }

        // If it's just a number, add the prefix and suffix
        if (/^\d+$/.test(pid)) {
            const formattedId = `pid:${pid}:null`;
            console.log(`Formatted product ID: ${formattedId}`);
            return formattedId;
        }

        // If it's in format "number:null", add the prefix
        if (/^\d+:null$/.test(pid)) {
            const formattedId = `pid:${pid}`;
            console.log(`Formatted product ID: ${formattedId}`);
            return formattedId;
        }

        // For other formats, try to extract the numeric part and reformat
        let numericPart = pid;
        if (pid.includes(':')) {
            const parts = pid.split(':');
            const numericParts = parts.filter(part => /^\d+$/.test(part));
            if (numericParts.length > 0) {
                numericPart = numericParts[0];
            }
        }

        const formattedId = `pid:${numericPart}:null`;
        console.log(`Formatted product ID: ${formattedId}`);
        return formattedId;
    }

    /**
     * Get time remaining until next auth attempt is allowed
     */
    public getTimeUntilNextAuthAllowed(): number {
        return this.tokenStore.getTimeUntilNextAuth(this.supplierId);
    }

    /**
     * Get a valid access token, refreshing if necessary
     */
    private async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        const cachedToken = this.tokenStore.getAccessToken(this.supplierId);
        if (cachedToken) {
            console.log('Using cached CJ Dropshipping access token');
            return cachedToken;
        }

        // Check if we can use refresh token
        const refreshToken = this.tokenStore.getRefreshToken(this.supplierId);
        if (refreshToken) {
            try {
                console.log('Attempting to refresh CJ Dropshipping token');
                const newToken = await this.refreshAccessToken(refreshToken);
                return newToken;
            } catch (error) {
                console.error('Failed to refresh CJ Dropshipping token, will try full auth', error);
                // Fall through to full authentication
            }
        }

        // Check if we're within the rate limit window
        if (!this.tokenStore.canAuthenticate(this.supplierId)) {
            const waitTime = this.tokenStore.getTimeUntilNextAuth(this.supplierId);
            throw new Error(
                `CJ_RATE_LIMIT:${waitTime}: ` +
                `CJ Dropshipping rate limit in effect.Please wait ${waitTime} seconds before trying again.` +
                ` Their API only allows one authentication request every 5 minutes.`
            );
        }

        // Update the auth timestamp
        this.tokenStore.updateAuthTimestamp(this.supplierId);

        // Otherwise, get a new token with full authentication
        try {
            // Make a request to the authentication endpoint
            const response = await fetch(new URL('v1/authentication/getAccessToken', this.apiEndpoint).toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // CJ Dropshipping requires an actual registered email address
                    // The email should be the one associated with your CJ account
                    email: "jaimin0609@gmail.com", // Replace with your CJ account email in the admin UI
                    // The API key from your CJ dashboard
                    password: this.apiKey
                }),
            });

            const data = await response.json();

            console.log('CJ Dropshipping Auth Response:', data);

            // Check for rate limit error and handle it specially
            if (data.code === 1600200 && data.message?.includes('QPS limit')) {
                throw new Error(
                    `CJ_RATE_LIMIT: 300: ` +
                    `CJ Dropshipping rate limit reached.Their API only allows one authentication request every 5 minutes.` +
                    ` Please wait and try again later.`
                );
            }

            if (!data.result || !data.data?.accessToken) {
                throw new Error(`Failed to get access token: ${data.message || 'Unknown error'} `);
            }

            // Store the tokens and their expiration times
            const accessToken = data.data.accessToken;
            const newRefreshToken = data.data.refreshToken;

            // Parse the expiry dates from ISO strings to timestamps
            let accessTokenExpires: number;
            let refreshTokenExpires: number;

            if (data.data.accessTokenExpiryDate) {
                accessTokenExpires = new Date(data.data.accessTokenExpiryDate).getTime();
            } else {
                // Default to 15 days if no expiry provided
                accessTokenExpires = Date.now() + (15 * 24 * 60 * 60 * 1000);
            }

            if (data.data.refreshTokenExpiryDate) {
                refreshTokenExpires = new Date(data.data.refreshTokenExpiryDate).getTime();
            } else {
                // Default to 180 days if no expiry provided
                refreshTokenExpires = Date.now() + (180 * 24 * 60 * 60 * 1000);
            }

            // Store tokens in the token store
            this.tokenStore.storeTokens(
                this.supplierId,
                accessToken,
                newRefreshToken,
                accessTokenExpires,
                refreshTokenExpires
            );

            return accessToken;
        } catch (error) {
            console.error('Failed to get CJ Dropshipping access token:', error);

            // If it's a rate limit error, pass it through
            if (error instanceof Error && error.message.includes('CJ_RATE_LIMIT:')) {
                throw error;
            }

            throw new Error('Authentication failed with CJ Dropshipping API');
        }
    }

    /**
     * Refresh an access token using a refresh token
     */
    private async refreshAccessToken(refreshToken: string): Promise<string> {
        try {
            // Make a request to refresh the token
            const response = await fetch(new URL('v1/authentication/refreshAccessToken', this.apiEndpoint).toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: refreshToken
                }),
            });

            const data = await response.json();

            console.log('CJ Dropshipping Token Refresh Response:', data);

            if (!data.result || !data.data?.accessToken) {
                throw new Error(`Failed to refresh access token: ${data.message || 'Unknown error'} `);
            }

            // Store the tokens and their expiration times
            const accessToken = data.data.accessToken;
            const newRefreshToken = data.data.refreshToken || refreshToken; // Use the new one if provided

            // Parse the expiry dates from ISO strings to timestamps
            let accessTokenExpires: number;
            let refreshTokenExpires: number;

            if (data.data.accessTokenExpiryDate) {
                accessTokenExpires = new Date(data.data.accessTokenExpiryDate).getTime();
            } else {
                // Default to 15 days if no expiry provided
                accessTokenExpires = Date.now() + (15 * 24 * 60 * 60 * 1000);
            }

            if (data.data.refreshTokenExpiryDate) {
                refreshTokenExpires = new Date(data.data.refreshTokenExpiryDate).getTime();
            } else {
                // Default to 180 days if no expiry provided
                refreshTokenExpires = Date.now() + (180 * 24 * 60 * 60 * 1000);
            }

            // Store tokens in the token store
            this.tokenStore.storeTokens(
                this.supplierId,
                accessToken,
                newRefreshToken,
                accessTokenExpires,
                refreshTokenExpires
            );

            return accessToken;
        } catch (error) {
            console.error('Failed to refresh CJ Dropshipping token:', error);
            throw error;
        }
    }    /**
     * Make a request to the CJ Dropshipping API with proper authentication
     */    // Track last request time to maintain rate limits
    private lastRequestTime: number = 0;

    // Delay execution to respect rate limits (1 request per second)
    private async respectRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minTimeBetweenRequests = 1100; // 1.1 seconds to be safe

        if (this.lastRequestTime > 0 && timeSinceLastRequest < minTimeBetweenRequests) {
            // Need to wait to respect rate limit
            const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
            console.log(`Waiting ${waitTime}ms for CJ Dropshipping rate limit...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    protected async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
        try {
            // Respect rate limits before making a request
            await this.respectRateLimit();

            const token = await this.getAccessToken();

            // Create a new headers object to avoid modifying the original
            const headers = new Headers(options.headers);

            // Add the authentication header
            headers.set('CJ-Access-Token', token);

            // Add content type if not present and this is a POST request
            if (options.method === 'POST' && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }

            // Make the request
            const url = new URL(path, this.apiEndpoint).toString();

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Extend timeout to 30 seconds

            // For debugging - log the request details
            console.log('CJ Dropshipping API Request:', {
                url,
                method: options.method || 'GET',
                body: options.body ? options.body.toString().substring(0, 200) + '...' : null,
                headers: Object.fromEntries(headers.entries())
            });

            const response = await fetch(url, {
                ...options,
                headers: headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Get the response text
            const responseText = await response.text();

            // For debugging - log the response with more details
            console.log('CJ Dropshipping API Response:', {
                url,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                text: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
            });

            // Check if the HTTP status indicates an error
            if (!response.ok) {
                if (response.status === 429) {
                    // Handle rate limit specific error
                    throw new Error(`HTTP error ${response.status}: Rate limit exceeded. QPS limit is 1 time/1second. Response: ${responseText.substring(0, 200)}`);
                }
                throw new Error(`HTTP error ${response.status}: ${response.statusText}.Response: ${responseText.substring(0, 200)} `);
            }

            // Try to parse the response as JSON
            try {
                return JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: The API request took too long to complete');
            }
            throw error;
        }
    }

    /**
     * Test the API connection to verify credentials
     */
    async testConnection(): Promise<boolean> {
        try {
            // First, attempt to get an access token
            await this.getAccessToken();

            // If we got here, authentication was successful
            return true;
        } catch (error) {
            console.error('CJ Dropshipping connection test failed:', error);

            // Handle rate limit as a special case
            if (error instanceof Error && error.message.includes('rate limit')) {
                // Re-throw the rate limit error so it can be shown to the user
                throw error;
            }

            return false;
        }
    }    /**
     * Get CJ Dropshipping product category list
     * @returns List of product categories
     */    async getCategoryList(): Promise<any> {
        try {
            // Check if we have valid cached categories
            const now = Date.now();
            if (this.categoryCache && now - this.categoryCacheTimestamp < this.CATEGORY_CACHE_TTL) {
                console.log('Using cached CJ Dropshipping category list');
                return {
                    success: true,
                    categories: this.categoryCache,
                    cached: true
                };
            }

            console.log('Fetching CJ Dropshipping category list...');
            const response = await this.makeRequest('v1/product/getCategory', {
                method: 'GET'
            });

            console.log('CJ Category API response:', response);

            if (!response) {
                throw new Error('Received empty response from CJ API');
            }

            if (!response.result) {
                throw new Error(`CJ Dropshipping categories error: ${response.message || 'Unknown error'}`);
            }

            // Ensure we have an array of categories, even if empty
            const categories = Array.isArray(response.data) ? response.data : [];
            console.log(`Retrieved ${categories.length} categories from CJ Dropshipping`);

            // Cache the categories
            this.categoryCache = categories;
            this.categoryCacheTimestamp = now;

            return {
                success: true,
                categories: categories
            };
        } catch (error) {
            console.error('Error getting CJ Dropshipping category list:', error);

            // If we have cached categories available and this was a rate limit error, use cache as fallback
            if (this.categoryCache && error instanceof Error &&
                (error.message.includes('Rate limit') || error.message.includes('429'))) {
                console.log('Using cached categories due to rate limit');
                return {
                    success: true,
                    categories: this.categoryCache,
                    cached: true,
                    note: 'Using cached data due to rate limit'
                };
            }

            // Check for rate limit errors specifically
            if (error instanceof Error && error.message.includes('CJ_RATE_LIMIT:')) {
                return {
                    success: false,
                    categories: [],
                    error: error.message
                };
            }

            return {
                success: false,
                categories: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Alias for getCategoryList to maintain consistent naming across the API
     * @returns List of product categories
     */
    async getCategories(): Promise<any> {
        return this.getCategoryList();
    }

    /**
     * Search for products in CJ Dropshipping catalog
     * @param params Search parameters
     * @returns Search results with detailed product information
     */
    async searchProducts(params: {
        pageNum?: number;
        pageSize?: number;
        productNameEn?: string;
        categoryId?: string;
        productSku?: string;
        minPrice?: number;
        maxPrice?: number;
        sortField?: string;
        sortType?: string;
    }): Promise<any> {
        try {
            const searchParams = {
                pageNum: params.pageNum || 1,
                pageSize: params.pageSize || 20,
                ...params
            };
            const queryParams = new URLSearchParams();
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });
            const endpoint = `v1/product/list?${queryParams.toString()}`;
            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            if (!response.result) {
                throw new Error(`CJ Dropshipping product search error: ${response.message || 'Unknown error'}`);
            }

            return {
                success: true,
                products: response.data?.list || [],
                total: response.data?.total || 0,
                page: params.pageNum || 1,
                pageSize: params.pageSize || 20,
                categories: response.data?.categoryList || []
            };
        } catch (error) {
            console.error('Error searching CJ Dropshipping products:', error);
            return {
                success: false,
                products: [],
                total: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get product details from CJ Dropshipping
     * @param pid Product ID (VID)
     * @returns Detailed product information
     */
    async getProductDetails(pid: string): Promise<any> {
        try {
            const formattedPid = this.formatProductId(pid); // Ensures "pid:NUMBER:null"
            // Delegate to the internal method that handles numeric PID extraction for API call
            return await this._getProductDetailsWithRawPid(formattedPid);
        } catch (error) {
            console.error('Error in getProductDetails wrapper:', error);
            return {
                success: false,
                product: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get variant details for a product
     * @param pid Product ID
     * @returns Product variant information
     */
    async getProductVariants(pid: string): Promise<any> {
        try {
            const formattedPid = this.formatProductId(pid); // Ensures "pid:NUMBER:null"
            // Delegate to the internal method that handles numeric PID extraction
            return await this._getProductVariantsWithRawPid(formattedPid);
        } catch (error) {
            console.error('Error in getProductVariants wrapper:', error);
            return {
                success: false,
                variants: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get product shipping information
     * @param params Shipping parameters
     * @returns Shipping information for the product
     */
    async getProductShipping(params: {
        pid: string;
        quantity: number;
        countryCode: string;
        province?: string;
        city?: string;
        zipCode?: string;
    }): Promise<any> {
        try {
            const formattedPid = this.formatProductId(params.pid);
            // This endpoint likely expects the "pid:NUMBER:null" format in the POST body.
            // If it expects a numeric PID, this would need adjustment similar to _getProductDetailsWithRawPid.
            // For now, assuming it takes the formattedPid as is, based on existing structure.
            const cleanParams = {
                ...params,
                pid: formattedPid
            };

            const response = await this.makeRequest('v1/product/shippings', {
                method: 'POST',
                body: JSON.stringify(cleanParams)
            });

            if (!response.result) {
                throw new Error(`CJ Dropshipping product shipping error: ${response.message || 'Unknown error'}`);
            }

            return {
                success: true,
                shipping: response.data || []
            };
        } catch (error) {
            console.error('Error getting CJ Dropshipping product shipping:', error);
            return {
                success: false,
                shipping: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get product comments/reviews
     * @param params Comment query parameters
     * @returns Product comments/reviews
     */
    async getProductComments(params: {
        pid: string;
        pageNum?: number;
        pageSize?: number;
    }): Promise<any> {
        try {
            const formattedPid = this.formatProductId(params.pid); // Ensures "pid:NUMBER:null"
            // Delegate to the internal method, passing all params including the formatted PID
            return await this._getProductCommentsWithRawPid({
                ...params, // Pass original pageNum, pageSize
                pid: formattedPid, // Override pid with the formatted one
            });
        } catch (error) {
            console.error('Error in getProductComments wrapper:', error);
            return {
                success: false,
                comments: [],
                total: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get similar products
     * @param params Query parameters
     * @returns List of similar products
     */
    async getSimilarProducts(params: {
        pid: string;
        pageNum?: number;
        pageSize?: number;
    }): Promise<any> {
        try {
            const formattedPid = this.formatProductId(params.pid); // Ensures "pid:NUMBER:null"
            // Delegate to the internal method
            return await this._getSimilarProductsWithRawPid({
                ...params, // Pass original pageNum, pageSize
                pid: formattedPid, // Override pid with the formatted one
            });
        } catch (error) {
            console.error('Error in getSimilarProducts wrapper:', error);
            return {
                success: false,
                products: [],
                total: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get complete product information including variants, shipping, comments and similar products
     * @param pid Product ID
     * @returns Complete product information
     */
    async getCompleteProductInformation(pid: string): Promise<any> {
        try {
            console.log(`getCompleteProductInformation called with pid: "${pid}"`);            // Format product ID only once at the top level
            const formattedPid = this.formatProductId(pid);
            console.log(`Formatted ID for all subsequent API calls: "${formattedPid}"`);

            // All _withRawPid methods expect "pid:NUMBER:null" and will extract numeric part internally
            const productDetailsResult = await this._getProductDetailsWithRawPid(formattedPid);
            if (!productDetailsResult.success) {
                console.error(`Failed to get product details in getCompleteProductInformation: ${productDetailsResult.error}`);
                return { success: false, product: null, error: `Failed to get product details: ${productDetailsResult.error}` };
            }

            const variantsResult = await this._getProductVariantsWithRawPid(formattedPid);
            const commentsResult = await this._getProductCommentsWithRawPid({ // Pass formattedPid here
                pid: formattedPid,
                pageNum: 1,
                pageSize: 10
            });
            const similarProductsResult = await this._getSimilarProductsWithRawPid({ // Pass formattedPid here
                pid: formattedPid,
                pageNum: 1,
                pageSize: 10
            });

            return {
                success: true,
                product: {
                    ...(productDetailsResult.product || {}),
                    variants: variantsResult.success ? variantsResult.variants : [],
                    comments: commentsResult.success ? commentsResult.comments : [],
                    commentCount: commentsResult.success ? commentsResult.total : 0,
                    similarProducts: similarProductsResult.success ? similarProductsResult.products : [],
                    similarProductCount: similarProductsResult.success ? similarProductsResult.total : 0
                }
            };
        } catch (error) {
            console.error('Error getting complete CJ Dropshipping product information:', error);
            return {
                success: false,
                product: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Public accessor for getting product details with a raw/pre-formatted PID.
     * Delegates to the private method which handles numeric extraction.
     */
    public getProductDetailsWithRawPid(pid: string): Promise<any> {
        // The 'pid' here is expected to be already formatted or a raw CJ ID string.
        // _getProductDetailsWithRawPid will attempt to extract numeric part.
        return this._getProductDetailsWithRawPid(pid);
    }

    /**
     * Internal method to get product details.
     * Accepts a product ID string (potentially "pid:NUMBER:null" or other formats).
     * Extracts the purely numeric part for the API call.
     * @param rawOrFormattedPid Product ID string (e.g., "12345", "pid:12345:null")
     */
    private async _getProductDetailsWithRawPid(rawOrFormattedPid: string): Promise<any> {
        try {
            const numericMatch = String(rawOrFormattedPid).match(/(\d+)/);
            let pidForApi: string;

            if (numericMatch && numericMatch[1]) {
                pidForApi = numericMatch[1]; // Use only the numeric part
            } else {
                console.warn(`_getProductDetailsWithRawPid: No numeric part found in PID: '${rawOrFormattedPid}'. API call might fail or use raw value.`);
                pidForApi = String(rawOrFormattedPid); // Fallback to the raw string if no numbers found
            }

            const endpoint = `v1/product/query?pid=${pidForApi}`; // Use numeric pidForApi directly
            console.log(`_getProductDetailsWithRawPid: Calling endpoint: ${endpoint}`);

            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' } as Record<string, string>
            });

            if (response.result) {
                return { success: true, product: response.data || null };
            } else {
                const errorMsg = `Failed to get product details (_getProductDetailsWithRawPid): ${response.message || 'Unknown error'} (API PID: ${pidForApi})`;
                console.log(errorMsg);
                return { success: false, product: null, error: errorMsg };
            }
        } catch (error) {
            console.error('Error in _getProductDetailsWithRawPid:', error);
            return { success: false, product: null, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Public accessor for getting product variants with a raw/pre-formatted PID.
     */
    public getProductVariantsWithRawPid(pid: string): Promise<any> {
        return this._getProductVariantsWithRawPid(pid);
    }

    /**
     * Internal method to get product variants.
     * Extracts numeric PID for the API call.
     * @param rawOrFormattedPid Product ID string
     */
    private async _getProductVariantsWithRawPid(rawOrFormattedPid: string): Promise<any> {
        try {
            const numericMatch = String(rawOrFormattedPid).match(/(\d+)/);
            let pidForApi: string;
            if (numericMatch && numericMatch[1]) {
                pidForApi = numericMatch[1];
            } else {
                console.warn(`_getProductVariantsWithRawPid: No numeric part found in PID: '${rawOrFormattedPid}'. Using raw value.`);
                pidForApi = String(rawOrFormattedPid);
            }

            // This endpoint also likely expects a numeric PID.
            const endpoint = `v1/product/variant/query?pid=${pidForApi}`;
            console.log(`_getProductVariantsWithRawPid: Calling endpoint: ${endpoint}`);

            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' } as Record<string, string>
            });

            if (response.result) {
                return { success: true, variants: response.data || [] };
            } else {
                const errorMsg = `Failed to get product variants (_getProductVariantsWithRawPid): ${response.message || 'Unknown error'} (API PID: ${pidForApi})`;
                console.log(errorMsg);
                return { success: false, variants: [], error: errorMsg };
            }
        } catch (error) {
            console.error('Error in _getProductVariantsWithRawPid:', error);
            return { success: false, variants: [], error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Public accessor for getting product comments with raw/pre-formatted PID in params.
     */
    public getProductCommentsWithRawPid(params: { pid: string; pageNum?: number; pageSize?: number; }): Promise<any> {
        return this._getProductCommentsWithRawPid(params);
    }

    /**
     * Internal method to get product comments.
     * Extracts numeric PID from params.pid for the API call.
     * @param params Object containing pid, pageNum, pageSize. pid is raw/formatted.
     */
    private async _getProductCommentsWithRawPid(params: { pid: string; pageNum?: number; pageSize?: number; }): Promise<any> {
        try {
            const numericMatch = String(params.pid).match(/(\d+)/);
            let pidForApi: string;
            if (numericMatch && numericMatch[1]) {
                pidForApi = numericMatch[1];
            } else {
                console.warn(`_getProductCommentsWithRawPid: No numeric part in PID: '${params.pid}'. Using raw value.`);
                pidForApi = String(params.pid);
            }

            const queryParams = new URLSearchParams({
                pid: pidForApi, // Use numeric pidForApi
                pageNum: String(params.pageNum || 1),
                pageSize: String(params.pageSize || 20)
            });
            const endpoint = `v1/product/productComments?${queryParams.toString()}`;
            console.log(`_getProductCommentsWithRawPid: Calling endpoint: ${endpoint}`);

            const response = await this.makeRequest(endpoint, { method: 'GET' });

            if (response.result) { // CJ API uses 'result', not 'success' in this response structure
                return { success: true, comments: response.data?.list || [], total: response.data?.total || 0 };
            } else {
                const errorMsg = `Failed to get product comments (_getProductCommentsWithRawPid): ${response.message || 'Unknown error'} (API PID: ${pidForApi})`;
                console.log(errorMsg);
                return { success: false, comments: [], total: 0, error: errorMsg };
            }
        } catch (error) {
            console.error('Error in _getProductCommentsWithRawPid:', error);
            return { success: false, comments: [], total: 0, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Public accessor for getting similar products with raw/pre-formatted PID in params.
     */
    public getSimilarProductsWithRawPid(params: { pid: string; pageNum?: number; pageSize?: number; }): Promise<any> {
        return this._getSimilarProductsWithRawPid(params);
    }

    /**
     * Internal method to get similar products.
     * Extracts numeric PID from params.pid for the API call.
     * @param params Object containing pid, pageNum, pageSize. pid is raw/formatted.
     */
    private async _getSimilarProductsWithRawPid(params: { pid: string; pageNum?: number; pageSize?: number; }): Promise<any> {
        try {
            const numericMatch = String(params.pid).match(/(\d+)/);
            let pidForApi: string;
            if (numericMatch && numericMatch[1]) {
                pidForApi = numericMatch[1];
            } else {
                console.warn(`_getSimilarProductsWithRawPid: No numeric part in PID: '${params.pid}'. Using raw value.`);
                pidForApi = String(params.pid);
            }

            const queryParams = new URLSearchParams({
                pid: pidForApi, // Use numeric pidForApi
                pageNum: String(params.pageNum || 1),
                pageSize: String(params.pageSize || 20)
            });
            const endpoint = `v1/product/similar?${queryParams.toString()}`;
            console.log(`_getSimilarProductsWithRawPid: Calling endpoint: ${endpoint}`);

            const response = await this.makeRequest(endpoint, { method: 'GET' });

            if (response.result) {
                return { success: true, products: response.data?.list || [], total: response.data?.total || 0 };
            } else {
                const errorMsg = `Failed to get similar products (_getSimilarProductsWithRawPid): ${response.message || 'Unknown error'} (API PID: ${pidForApi})`;
                console.log(errorMsg);
                return { success: false, products: [], total: 0, error: errorMsg };
            }
        } catch (error) {
            console.error('Error in _getSimilarProductsWithRawPid:', error);
            return { success: false, products: [], total: 0, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Get list of countries supported by CJ Dropshipping
     */
    async getCountries(): Promise<any> {
        try {
            const response = await this.makeRequest('v1/shipping/getCountry', {
                method: 'GET'
            });

            if (!response.result) {
                throw new Error(`CJ Dropshipping countries error: ${response.message || 'Unknown error'}`);
            }

            return {
                success: true,
                countries: response.data || []
            };
        } catch (error) {
            console.error('Error getting CJ Dropshipping countries:', error);
            return {
                success: false,
                countries: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get shipping methods supported by CJ Dropshipping
     * @param countryCode Country code to filter shipping methods
     */
    async getShippingMethods(countryCode?: string): Promise<any> {
        try {
            let endpoint = 'v1/shipping/getList';
            if (countryCode) {
                // Corrected query parameter formatting
                const queryParams = new URLSearchParams({ countryCode: countryCode });
                endpoint += `?${queryParams.toString()}`;
            }

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            if (!response.result) {
                throw new Error(`CJ Dropshipping shipping methods error: ${response.message || 'Unknown error'}`);
            }

            return {
                success: true,
                shippingMethods: response.data || []
            };
        } catch (error) {
            console.error('Error getting CJ Dropshipping shipping methods:', error);
            return {
                success: false,
                shippingMethods: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Create an order with CJ Dropshipping
     */
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        const cjOrder = {
            orderNumber: orderData.customer_order_id,
            shippingAddress: {
                name: orderData.shipping_address.name,
                phone: orderData.shipping_address.phone,
                email: orderData.shipping_address.email,
                address1: orderData.shipping_address.address1,
                address2: orderData.shipping_address.address2 || '',
                city: orderData.shipping_address.city,
                province: orderData.shipping_address.state || '',
                country: orderData.shipping_address.country,
                zip: orderData.shipping_address.postal_code,
            },
            productList: orderData.items.map(item => ({
                vid: this.formatProductId(item.product_id),
                quantity: item.quantity,
            })),
            // logisticsName: "CJEPACKET", // Example: Specify if required by API and known
            // fromWarehouseId: "someWarehouseId" // Example: Specify if required
        };

        try {
            const response = await this.makeRequest('v1/shopping/order/create', {
                method: 'POST',
                body: JSON.stringify(cjOrder),
            });

            // CJ API success is indicated by response.result === true or response.code === 200
            const isSuccess = response.result === true || (response.result === undefined && response.code === 200);

            if (!isSuccess) {
                const errorMessage = `CJ Dropshipping API error creating order: ${response.message || 'Unknown error'} (Code: ${response.code}, Result: ${response.result})`;
                console.error(errorMessage);
                return {
                    success: false,
                    external_id: '',
                    status: 'Failed',
                    tracking_number: null,
                    tracking_url: null,
                    carrier: null,
                    estimated_delivery: null,
                };
            }

            const externalId = response.data?.orderId || response.data?.id || response.data?.orderNo || String(Date.now());

            return {
                success: true,
                external_id: externalId,
                status: 'Pending',
                tracking_number: null,
                tracking_url: null,
                carrier: null,
                estimated_delivery: null
            };

        } catch (error) {
            console.error('Error creating CJ Dropshipping order:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                external_id: '',
                status: 'Error',
                tracking_number: null,
                tracking_url: null,
                carrier: null,
                estimated_delivery: null,
            };
        }
    }

    /**
     * Get order status from CJ Dropshipping
     */
    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        try {
            const response = await this.makeRequest(`v1/shopping/order/getOrder?orderId=${externalOrderId}`);

            const isSuccess = response.result === true || (response.result === undefined && response.code === 200);

            if (!isSuccess || !response.data) {
                const errorMessage = `CJ Dropshipping API error getting order status for ${externalOrderId}: ${response.message || 'Unknown error'} (Code: ${response.code}, Result: ${response.result})`;
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            const orderDetails = response.data;
            let internalStatus: SupplierOrderStatusResponse['status'] = 'Unknown';
            const cjOrderStatus = String(orderDetails.orderStatus || orderDetails.status || '').toUpperCase();

            switch (cjOrderStatus) {
                case 'PENDING': internalStatus = 'Pending'; break;
                case 'PROCESSING': internalStatus = 'Processing'; break;
                case 'PROCESSED': internalStatus = 'Processing'; break;
                case 'DISPATCHED': internalStatus = 'Shipped'; break;
                case 'SHIPPED': internalStatus = 'Shipped'; break;
                case 'COMPLETED': internalStatus = 'Delivered'; break;
                case 'DELIVERED': internalStatus = 'Delivered'; break;
                case 'CLOSED': internalStatus = 'Cancelled'; break;
                case 'CANCELLED': internalStatus = 'Cancelled'; break;
                default: internalStatus = 'Unknown';
            }

            const trackingNumber = orderDetails.trackingNumber || orderDetails.trackingNo || orderDetails.logisticsInfo?.trackingNumber || null;
            const carrier = orderDetails.logisticsName || orderDetails.logisticsInfo?.logisticsName || null;
            const trackingUrl = orderDetails.trackingUrl || orderDetails.logisticsInfo?.trackingUrl || null;
            const estimatedDelivery = orderDetails.estimatedDeliveryTime || orderDetails.estimatedDeliveryDate || null;

            return {
                status: internalStatus,
                tracking_number: trackingNumber,
                tracking_url: trackingUrl,
                carrier: carrier,
                estimated_delivery: estimatedDelivery
            };

        } catch (error) {
            console.error(`Error getting CJ Dropshipping order status for ${externalOrderId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(String(error));
        }
    }

    /**
     * Clear the category cache to force a fresh fetch on next request
     */
    public clearCategoryCache(): void {
        console.log('Clearing CJ Dropshipping category cache');
        this.categoryCache = null;
        this.categoryCacheTimestamp = 0;
    }
}
