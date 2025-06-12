import { toast } from 'sonner';

// Printful API Configuration
const PRINTFUL_API_BASE = 'https://api.printful.com';
const PRINTFUL_STORE_ID = process.env.NEXT_PUBLIC_PRINTFUL_STORE_ID;
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

// Types
export interface PrintfulProduct {
    id: number;
    external_id: string;
    name: string;
    variants: PrintfulVariant[];
    sync_product: {
        id: number;
        external_id: string;
        name: string;
        thumbnail_url: string;
    };
}

export interface PrintfulVariant {
    id: number;
    external_id: string;
    sync_variant_id: number;
    name: string;
    synced: boolean;
    variant_id: number;
    main_category_id: number;
    warehouse_product_variant_id: number;
    retail_price: string;
    sku: string;
    currency: string;
    product: {
        variant_id: number;
        product_id: number;
        image: string;
        name: string;
    };
    files: PrintfulFile[];
    options: PrintfulOption[];
    is_ignored: boolean;
}

export interface PrintfulFile {
    id: number;
    type: string;
    hash: string;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    x: number;
    y: number;
    scale: number;
    visible: boolean;
    is_default: boolean;
}

export interface PrintfulOption {
    id: string;
    value: string;
}

export interface PrintfulOrder {
    id: number;
    external_id: string;
    store: number;
    status: string;
    shipping: string;
    created: number;
    updated: number;
    recipient: PrintfulRecipient;
    items: PrintfulOrderItem[];
    costs: PrintfulCosts;
    retail_costs: PrintfulCosts;
    shipments: PrintfulShipment[];
}

export interface PrintfulRecipient {
    name: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state_code: string;
    state_name: string;
    country_code: string;
    country_name: string;
    zip: string;
    phone: string;
    email: string;
}

export interface PrintfulOrderItem {
    id: number;
    external_id: string;
    variant_id: number;
    sync_variant_id: number;
    external_variant_id: string;
    quantity: number;
    price: string;
    retail_price: string;
    name: string;
    product: {
        variant_id: number;
        product_id: number;
        image: string;
        name: string;
    };
    files: PrintfulFile[];
    options: PrintfulOption[];
    sku: string;
    discontinued: boolean;
    out_of_stock: boolean;
}

export interface PrintfulCosts {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    tax: string;
    vat: string;
    total: string;
}

export interface PrintfulShipment {
    id: number;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    created: number;
    ship_date: string;
    shipped_at: number;
    reshipment: boolean;
    items: PrintfulOrderItem[];
}

export interface DesignMockupRequest {
    variant_id: number;
    format: 'jpg' | 'png';
    files: {
        placement: string;
        image_url: string;
        position?: {
            area_width: number;
            area_height: number;
            width: number;
            height: number;
            top: number;
            left: number;
        };
    }[];
    options?: PrintfulOption[];
}

export interface MockupGenerationResult {
    code: number;
    result: {
        product_id: number;
        variant_id: number;
        placements: {
            placement: string;
            mockup_url: string;
        }[];
    };
    extra: any[];
}

// Printful Integration Service
export class PrintfulIntegrationService {
    private apiKey: string;
    private storeId: string;

    constructor() {
        this.apiKey = PRINTFUL_API_KEY || '';
        this.storeId = PRINTFUL_STORE_ID || '';

        if (!this.apiKey) {
            console.warn('Printful API key not configured');
        }
    }

    private async makeRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        data?: any
    ): Promise<T> {
        if (!this.apiKey) {
            throw new Error('Printful API key not configured');
        }

        const url = `${PRINTFUL_API_BASE}${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Printful API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Printful API request failed:', error);
            throw error;
        }
    }

    // Get store products
    async getStoreProducts(): Promise<PrintfulProduct[]> {
        try {
            const response = await this.makeRequest<{ code: number; result: PrintfulProduct[] }>('/store/products');
            return response.result || [];
        } catch (error) {
            console.error('Failed to fetch Printful products:', error);
            toast.error('Failed to load products from Printful');
            return [];
        }
    }

    // Get product by ID
    async getProduct(id: number): Promise<PrintfulProduct | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: { sync_product: any; sync_variants: PrintfulVariant[] } }>(`/store/products/${id}`);
            if (response.result) {
                return {
                    id: response.result.sync_product.id,
                    external_id: response.result.sync_product.external_id,
                    name: response.result.sync_product.name,
                    variants: response.result.sync_variants || [],
                    sync_product: response.result.sync_product
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Printful product:', error);
            toast.error('Failed to load product details');
            return null;
        }
    }

    // Upload design file
    async uploadFile(file: File): Promise<{ id: number; url: string } | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${PRINTFUL_API_BASE}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();
            return {
                id: result.result.id,
                url: result.result.url
            };
        } catch (error) {
            console.error('Failed to upload file to Printful:', error);
            toast.error('Failed to upload design file');
            return null;
        }
    }

    // Generate product mockup
    async generateMockup(request: DesignMockupRequest): Promise<MockupGenerationResult | null> {
        try {
            const response = await this.makeRequest<MockupGenerationResult>(
                `/mockup-generator/create-task/${request.variant_id}`,
                'POST',
                {
                    format: request.format,
                    files: request.files,
                    options: request.options || []
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to generate mockup:', error);
            toast.error('Failed to generate product mockup');
            return null;
        }
    }

    // Get mockup task result
    async getMockupResult(taskKey: string): Promise<MockupGenerationResult | null> {
        try {
            const response = await this.makeRequest<MockupGenerationResult>(`/mockup-generator/task-result/${taskKey}`);
            return response;
        } catch (error) {
            console.error('Failed to get mockup result:', error);
            return null;
        }
    }

    // Create order
    async createOrder(orderData: {
        external_id: string;
        recipient: PrintfulRecipient;
        items: {
            sync_variant_id?: number;
            external_variant_id?: string;
            quantity: number;
            files?: PrintfulFile[];
        }[];
    }): Promise<PrintfulOrder | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: PrintfulOrder }>(
                '/orders',
                'POST',
                orderData
            );
            return response.result;
        } catch (error) {
            console.error('Failed to create Printful order:', error);
            toast.error('Failed to create order');
            return null;
        }
    }

    // Get order status
    async getOrder(id: number): Promise<PrintfulOrder | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: PrintfulOrder }>(`/orders/${id}`);
            return response.result;
        } catch (error) {
            console.error('Failed to fetch order:', error);
            return null;
        }
    }

    // Confirm order (submit for fulfillment)
    async confirmOrder(id: number): Promise<PrintfulOrder | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: PrintfulOrder }>(
                `/orders/${id}/confirm`,
                'POST'
            );
            toast.success('Order submitted for fulfillment');
            return response.result;
        } catch (error) {
            console.error('Failed to confirm order:', error);
            toast.error('Failed to submit order for fulfillment');
            return null;
        }
    }

    // Get available product templates
    async getProductTemplates(): Promise<any[]> {
        try {
            const response = await this.makeRequest<{ code: number; result: any[] }>('/products');
            return response.result || [];
        } catch (error) {
            console.error('Failed to fetch product templates:', error);
            return [];
        }
    }

    // Calculate shipping rates
    async calculateShipping(recipient: PrintfulRecipient, items: any[]): Promise<any[]> {
        try {
            const response = await this.makeRequest<{ code: number; result: any[] }>(
                '/shipping/rates',
                'POST',
                {
                    recipient,
                    items,
                    currency: 'USD',
                    locale: 'en_US'
                }
            );
            return response.result || [];
        } catch (error) {
            console.error('Failed to calculate shipping:', error);
            return [];
        }
    }

    // Get countries list for shipping
    async getCountries(): Promise<any[]> {
        try {
            const response = await this.makeRequest<{ code: number; result: any[] }>('/countries');
            return response.result || [];
        } catch (error) {
            console.error('Failed to fetch countries:', error);
            return [];
        }
    }

    // Get store info
    async getStoreInfo(): Promise<any | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: any }>('/store');
            return response.result;
        } catch (error) {
            console.error('Failed to fetch store info:', error);
            return null;
        }
    }

    // Sync product with custom design
    async syncProductWithDesign(productId: number, designData: {
        name: string;
        thumbnail: string;
        files: PrintfulFile[];
        variants: {
            id: number;
            price: string;
            is_enabled: boolean;
        }[];
    }): Promise<PrintfulProduct | null> {
        try {
            const response = await this.makeRequest<{ code: number; result: PrintfulProduct }>(
                `/store/products/${productId}`,
                'PUT',
                {
                    sync_product: {
                        name: designData.name,
                        thumbnail: designData.thumbnail
                    },
                    sync_variants: designData.variants.map(variant => ({
                        id: variant.id,
                        retail_price: variant.price,
                        is_enabled: variant.is_enabled,
                        files: designData.files
                    }))
                }
            );
            toast.success('Product synced successfully');
            return response.result;
        } catch (error) {
            console.error('Failed to sync product:', error);
            toast.error('Failed to sync product with design');
            return null;
        }
    }
}

// Export singleton instance
export const printfulService = new PrintfulIntegrationService();