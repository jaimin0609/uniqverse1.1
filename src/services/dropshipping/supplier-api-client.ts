import { CJDropshippingApiClient } from './cj-dropshipping-client';

/**
 * Factory function to create supplier-specific API clients
 */
export function createSupplierApiClient({ supplierId, apiKey, apiEndpoint }: {
    supplierId: string;
    apiKey: string;
    apiEndpoint: string;
}) {
    // Determine which client to use based on the supplier's API endpoint
    if (apiEndpoint.includes('aliexpress')) {
        return new AliExpressApiClient(apiKey, apiEndpoint);
    } else if (apiEndpoint.includes('spocket')) {
        return new SpocketApiClient(apiKey, apiEndpoint);
    } else if (apiEndpoint.includes('cjdropshipping')) {
        return new CJDropshippingApiClient(apiKey, apiEndpoint, supplierId);
    } else if (apiEndpoint.includes('oberlo')) {
        return new OberloApiClient(apiKey, apiEndpoint);
    } else if (apiEndpoint.includes('modalyst')) {
        return new ModalystApiClient(apiKey, apiEndpoint);
    } else {
        // Generic client for custom API endpoints
        return new GenericSupplierApiClient(apiKey, apiEndpoint);
    }
}

// Export CJDropshippingApiClient for direct use
export { CJDropshippingApiClient };

/**
 * Base class for all supplier API clients
 */
abstract class BaseSupplierApiClient {
    protected apiKey: string;
    protected apiEndpoint: string;

    constructor(apiKey: string, apiEndpoint: string) {
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint.endsWith('/') ? apiEndpoint : apiEndpoint + '/';
    }

    /**
     * Create a new order with the supplier
     */
    abstract createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse>;

    /**
     * Get the status of an existing order
     */
    abstract getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse>;

    /**
     * Format the API response to a standardized format
     */
    protected formatResponse(response: any): SupplierOrderResponse {
        return {
            success: true,
            external_id: response.id || response.order_id || response.orderId || '',
            status: response.status || 'processing',
            tracking_number: response.tracking_number || response.trackingNumber || null,
            tracking_url: response.tracking_url || response.trackingUrl || null,
            carrier: response.carrier || response.shipping_carrier || null,
            estimated_delivery: response.estimated_delivery || response.estimatedDelivery || null,
        };
    }

    /**
     * Safely parse a JSON response or return an empty object
     */
    protected safeParseJson(text: string): any {
        try {
            return JSON.parse(text);
        } catch (e) {
            return {};
        }
    }

    /**
     * Make a request to the supplier API with proper error handling
     */
    protected async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
        try {
            const url = new URL(path, this.apiEndpoint).toString();

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json().catch(() => ({}));
            return data;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: The API request took too long to complete');
            }
            throw error;
        }
    }
}

/**
 * Generic API client that works with most RESTful APIs
 */
class GenericSupplierApiClient extends BaseSupplierApiClient {
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        const response = await this.makeRequest('orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                order_id: orderData.order_id,
                customer_order_id: orderData.customer_order_id,
                shipping_address: orderData.shipping_address,
                items: orderData.items,
            }),
        });

        return this.formatResponse(response);
    }

    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        const response = await this.makeRequest(`orders/${externalOrderId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        return {
            status: response.status || 'processing',
            tracking_number: response.tracking_number || null,
            tracking_url: response.tracking_url || null,
            carrier: response.carrier || null,
            estimated_delivery: null,
        };
    }
}

/**
 * AliExpress API Client for dropshipping integration
 */
class AliExpressApiClient extends BaseSupplierApiClient {
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        // Format the order data according to AliExpress API requirements
        const aliExpressOrder = {
            logistic_address: {
                contact_person: orderData.shipping_address.name,
                address: orderData.shipping_address.address1,
                address2: orderData.shipping_address.address2,
                city: orderData.shipping_address.city,
                province: orderData.shipping_address.state,
                zip: orderData.shipping_address.postal_code,
                country: orderData.shipping_address.country,
                phone_number: orderData.shipping_address.phone,
            },
            product_items: orderData.items.map(item => ({
                product_id: item.product_id,
                product_count: item.quantity,
                sku_attr: item.options,
            })),
            ...orderData,
        };

        const response = await this.makeRequest('drop/shipping/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey,
            },
            body: JSON.stringify(aliExpressOrder),
        });

        return {
            success: response.code === '0' || response.code === 0,
            external_id: response.result?.order_id || '',
            status: 'processing',
            tracking_number: null,
            tracking_url: null,
            carrier: null,
            estimated_delivery: null,
        };
    }

    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        const response = await this.makeRequest(`drop/shipping/order/get?order_id=${externalOrderId}`, {
            headers: {
                'X-API-KEY': this.apiKey,
            },
        });

        // Map AliExpress order status to our standardized format
        let status = 'processing';
        if (response.result?.order_status) {
            switch (response.result.order_status) {
                case 'PLACE_ORDER_SUCCESS':
                    status = 'processing';
                    break;
                case 'IN_CANCEL':
                    status = 'cancelled';
                    break;
                case 'FINISH':
                    status = 'completed';
                    break;
                case 'WAIT_BUYER_ACCEPT_GOODS':
                case 'WAIT_GROUP_SUCCESS':
                    status = 'shipped';
                    break;
                default:
                    status = 'processing';
            }
        }

        return {
            status,
            tracking_number: response.result?.logistics_info?.tracking_number || null,
            tracking_url: response.result?.logistics_info?.tracking_url || null,
            carrier: response.result?.logistics_info?.logistics_company || null,
            estimated_delivery: null,
        };
    }
}

/**
 * Spocket API Client for dropshipping integration
 */
class SpocketApiClient extends BaseSupplierApiClient {
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        // Format the order data according to Spocket API requirements
        const spocketOrder = {
            order_reference: orderData.customer_order_id,
            shipping_details: {
                first_name: orderData.shipping_address.name.split(' ')[0],
                last_name: orderData.shipping_address.name.split(' ').slice(1).join(' '),
                address1: orderData.shipping_address.address1,
                address2: orderData.shipping_address.address2,
                city: orderData.shipping_address.city,
                province: orderData.shipping_address.state,
                zip: orderData.shipping_address.postal_code,
                country: orderData.shipping_address.country,
                phone: orderData.shipping_address.phone,
                email: orderData.shipping_address.email,
            },
            line_items: orderData.items.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
            })),
        };

        const response = await this.makeRequest('orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(spocketOrder),
        });

        return {
            success: !!response.id,
            external_id: response.id || '',
            status: response.status || 'processing',
            tracking_number: response.tracking_number || null,
            tracking_url: response.tracking_url || null,
            carrier: response.carrier || null,
            estimated_delivery: null,
        };
    }

    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        const response = await this.makeRequest(`orders/${externalOrderId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        return {
            status: response.status || 'processing',
            tracking_number: response.tracking_number || null,
            tracking_url: response.tracking_url || null,
            carrier: response.carrier || null,
            estimated_delivery: null,
        };
    }
}

/**
 * Oberlo API Client
 */
class OberloApiClient extends BaseSupplierApiClient {
    // Implementation similar to others
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        // Implement Oberlo-specific order creation
        const response = await this.makeRequest('orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(orderData),
        });

        return this.formatResponse(response);
    }

    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        const response = await this.makeRequest(`orders/${externalOrderId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        return {
            status: response.fulfillment_status || 'processing',
            tracking_number: response.tracking_number || null,
            tracking_url: response.tracking_url || null,
            carrier: response.carrier || null,
            estimated_delivery: null,
        };
    }
}

/**
 * Modalyst API Client
 */
class ModalystApiClient extends BaseSupplierApiClient {
    // Implementation similar to others
    async createOrder(orderData: SupplierOrderData): Promise<SupplierOrderResponse> {
        // Implement Modalyst-specific order creation
        const response = await this.makeRequest('orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(orderData),
        });

        return this.formatResponse(response);
    }

    async getOrderStatus(externalOrderId: string): Promise<SupplierOrderStatusResponse> {
        const response = await this.makeRequest(`orders/${externalOrderId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        return {
            status: response.status || 'processing',
            tracking_number: response.tracking_info?.tracking_number || null,
            tracking_url: response.tracking_info?.tracking_url || null,
            carrier: response.tracking_info?.carrier || null,
            estimated_delivery: null,
        };
    }
}

// Type definitions
export interface SupplierOrderData {
    items: {
        product_id: string;
        sku?: string;
        name?: string;
        quantity: number;
        price?: number;
        variant_id?: string | null;
        options?: string | null;
    }[];
    shipping_address: {
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state?: string;
        country: string;
        postal_code: string;
        phone?: string;
        email?: string;
    };
    order_id: string;
    customer_order_id: string;
    notes?: string;
}

export interface SupplierOrderResponse {
    success: boolean;
    external_id: string;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier: string | null;
    estimated_delivery: string | null;
}

export interface SupplierOrderStatusResponse {
    success?: boolean;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier: string | null;
    estimated_delivery: string | null;
}