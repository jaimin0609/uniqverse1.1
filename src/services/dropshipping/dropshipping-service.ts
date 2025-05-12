import { db } from "@/lib/db";
import { createSupplierApiClient, SupplierOrderResponse } from "./supplier-api-client";

// Define result types to fix array pushing issues
interface ProcessResult {
    supplierId: string;
    supplierName: string;
    supplierOrderId?: string;
    itemCount: number;
    success: boolean;
    error?: string;
}

interface OrderStatusResult {
    supplierName: string;
    orderId: string;
    externalOrderId: string | null;
    oldStatus?: string;
    newStatus?: string;
    success: boolean;
    error?: string;
}

interface SupplierError {
    supplierName: string;
    success: boolean;
    error: string;
}

interface OrderUpdateData {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
}

/**
 * Main service for handling dropshipping operations
 */
export class DropshippingService {
    /**
     * Process a new order to check for dropshipping items and create supplier orders
     * This should be called after a successful customer order is created
     */
    static async processNewOrder(orderId: string) {
        try {
            // Get the order with all items and their related products
            const order = await db.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    supplier: true,
                                },
                            },
                            variant: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            // Group items by supplier
            const supplierItems: Record<string, any[]> = {};

            // Process each item in the order to identify dropshipping items
            for (const item of order.items) {
                // Skip items without a supplier
                if (!item.product.supplierId) continue;

                // Group items by supplier ID
                if (!supplierItems[item.product.supplierId]) {
                    supplierItems[item.product.supplierId] = [];
                }

                // Add the item to the supplier's list
                supplierItems[item.product.supplierId].push(item);
            }

            // Process each supplier's items and create supplier orders
            const results: ProcessResult[] = [];
            for (const [supplierId, items] of Object.entries(supplierItems)) {
                // Get supplier details
                const supplier = await db.supplier.findUnique({
                    where: { id: supplierId },
                });

                if (!supplier) continue;

                // Skip inactive suppliers
                if (supplier.status !== "ACTIVE") {
                    console.log(`Supplier ${supplier.name} is inactive, skipping dropshipping`);
                    continue;
                }

                try {
                    // Create a supplier order
                    const supplierOrder = await this.createSupplierOrder(supplier, items, order);

                    // If API is connected, automatically send the order to the supplier
                    if (supplier.apiKey && supplier.apiEndpoint) {
                        await this.sendOrderToSupplier(supplierOrder.id);
                    }

                    results.push({
                        supplierId,
                        supplierName: supplier.name,
                        supplierOrderId: supplierOrder.id,
                        itemCount: items.length,
                        success: true,
                    });
                } catch (error) {
                    console.error(`Error creating supplier order for ${supplier.name}:`, error);
                    results.push({
                        supplierId,
                        supplierName: supplier.name,
                        itemCount: items.length,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }

            return {
                success: results.some(r => r.success),
                results,
            };
        } catch (error) {
            console.error("Error processing order for dropshipping:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Create a supplier order for a specific supplier's items in an order
     */
    private static async createSupplierOrder(supplier: any, items: any[], order: any) {
        // Calculate total cost based on cost price or apply default markup if missing
        let totalCost = 0;
        for (const item of items) {
            const costPrice = item.product.costPrice || (item.price * 0.7); // Default 30% markup if costPrice not set
            totalCost += costPrice * item.quantity;
        }

        // Add shipping cost from supplier if available
        const shippingCost = supplier.averageShipping || 0;

        // Create the supplier order
        const supplierOrder = await db.supplierOrder.create({
            data: {
                supplierId: supplier.id,
                status: "PENDING",
                orderDate: new Date(),
                totalCost: totalCost + shippingCost,
                shippingCost: shippingCost,
                currency: "USD", // Default currency
                notes: `Auto-generated from customer order #${order.orderNumber}`,
            } as any, // Type cast to avoid Prisma type issues
        });

        // Update the order items with the supplier order ID
        for (const item of items) {
            await db.orderItem.update({
                where: { id: item.id },
                data: {
                    supplierOrderId: supplierOrder.id,
                    supplierOrderStatus: "PENDING",
                    profitAmount: item.total - (item.product.costPrice || (item.price * 0.7)) * item.quantity,
                },
            });
        }

        return supplierOrder;
    }

    /**
     * Send an order to a supplier using their API
     */
    static async sendOrderToSupplier(supplierOrderId: string) {
        try {
            // Get supplier order with items and supplier info
            const supplierOrder = await db.supplierOrder.findUnique({
                where: { id: supplierOrderId },
                include: {
                    Supplier: true,
                    OrderItem: {
                        include: {
                            product: true,
                            variant: true,
                            order: {
                                include: {
                                    shippingAddress: true,
                                    user: true, // Include user data to get email
                                },
                            },
                        },
                    },
                },
            });

            if (!supplierOrder) {
                throw new Error(`Supplier order ${supplierOrderId} not found`);
            }

            // Skip if no API connection info
            if (!supplierOrder.Supplier.apiKey || !supplierOrder.Supplier.apiEndpoint) {
                throw new Error(`Supplier ${supplierOrder.Supplier.name} has no API connection`);
            }

            // Get the first order to extract shipping information (all items should belong to the same order)
            const firstOrderItem = supplierOrder.OrderItem[0];
            if (!firstOrderItem || !firstOrderItem.order) {
                throw new Error(`No order items found for supplier order ${supplierOrderId}`);
            }

            const customerOrder = firstOrderItem.order;
            const shippingAddress = customerOrder.shippingAddress;

            if (!shippingAddress) {
                throw new Error(`No shipping address found for order`);
            }

            // Create a supplier-specific API client
            const apiClient = createSupplierApiClient({
                supplierId: supplierOrder.supplierId,
                apiKey: supplierOrder.Supplier.apiKey || "", // Add empty string fallback
                apiEndpoint: supplierOrder.Supplier.apiEndpoint || "", // Add empty string fallback
            });

            // Format order items for the supplier API
            const formattedItems = supplierOrder.OrderItem.map(item => ({
                product_id: item.product.supplierProductId || item.productId || "",
                sku: item.product.sku || '',
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.costPrice || (item.price * 0.7),
                variant_id: item.variant?.id || null,
                options: item.variant?.options || null,
            }));

            // Format shipping address for the supplier API
            const formattedAddress = {
                name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || '',
                city: shippingAddress.city,
                state: shippingAddress.state || '',
                country: shippingAddress.country,
                postal_code: shippingAddress.postalCode,
                phone: shippingAddress.phone || '',
                email: customerOrder.user?.email || '',
            };

            // Send the order to the supplier
            const result = await apiClient.createOrder({
                items: formattedItems,
                shipping_address: formattedAddress,
                order_id: supplierOrderId,
                customer_order_id: customerOrder.orderNumber,
            });

            // Update the supplier order with the external order ID and status
            await db.supplierOrder.update({
                where: { id: supplierOrderId },
                data: {
                    externalOrderId: result.external_id || null,
                    status: "PROCESSING", // Move to processing now that it's sent to supplier
                    trackingNumber: result.tracking_number || null,
                    trackingUrl: result.tracking_url || null,
                    carrier: result.carrier || null,
                    estimatedDelivery: result.estimated_delivery ? new Date(result.estimated_delivery) : null,
                    notes: `${supplierOrder.notes || ''}\nSent to supplier API on ${new Date().toISOString()}. Response: ${JSON.stringify(result)}`,
                },
            });

            // Update all order items with the new status
            for (const item of supplierOrder.OrderItem) {
                await db.orderItem.update({
                    where: { id: item.id },
                    data: {
                        supplierOrderStatus: "PROCESSING",
                    },
                });
            }

            return {
                success: true,
                externalOrderId: result.external_id,
            };
        } catch (error) {
            console.error(`Error sending order to supplier:`, error);

            // Update the supplier order with the error
            await db.supplierOrder.update({
                where: { id: supplierOrderId },
                data: {
                    errorMessage: error instanceof Error ? error.message : String(error),
                    notes: `${(await db.supplierOrder.findUnique({ where: { id: supplierOrderId } }))?.notes || ''}\nError sending to supplier API on ${new Date().toISOString()}: ${error instanceof Error ? error.message : String(error)}`,
                },
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Check for order updates from suppliers (to be run on a schedule)
     */
    static async checkOrderUpdates() {
        try {
            // Get all active suppliers with API connections
            const suppliers = await db.supplier.findMany({
                where: {
                    status: "ACTIVE",
                    apiKey: { not: null },
                    apiEndpoint: { not: null },
                },
            });

            const results: OrderStatusResult[] = [];
            let updatedCount = 0;
            let totalCount = 0;

            // For each supplier, check for order updates
            for (const supplier of suppliers) {
                try {
                    // Get all processing supplier orders for this supplier
                    const supplierOrders = await db.supplierOrder.findMany({
                        where: {
                            supplierId: supplier.id,
                            status: "PROCESSING",
                            externalOrderId: { not: null },
                        },
                    });

                    totalCount += supplierOrders.length;

                    // Skip suppliers with null API credentials
                    if (!supplier.apiKey || !supplier.apiEndpoint) {
                        continue;
                    }

                    // Create a supplier-specific API client
                    const apiClient = createSupplierApiClient({
                        supplierId: supplier.id,
                        apiKey: supplier.apiKey,
                        apiEndpoint: supplier.apiEndpoint,
                    });

                    // Check each order for updates
                    for (const order of supplierOrders) {
                        try {
                            // Skip orders with null externalOrderId
                            if (!order.externalOrderId) {
                                continue;
                            }

                            const orderStatus = await apiClient.getOrderStatus(order.externalOrderId);

                            // Update the supplier order with the new status
                            if (orderStatus.status && orderStatus.status !== order.status) {
                                await this.updateSupplierOrderStatus(
                                    order.id,
                                    orderStatus.status,
                                    {
                                        trackingNumber: orderStatus.tracking_number || undefined,
                                        trackingUrl: orderStatus.tracking_url || undefined,
                                        carrier: orderStatus.carrier || undefined,
                                        estimatedDelivery: orderStatus.estimated_delivery || undefined,
                                    }
                                );

                                updatedCount++;

                                results.push({
                                    supplierName: supplier.name,
                                    orderId: order.id,
                                    externalOrderId: order.externalOrderId,
                                    oldStatus: order.status,
                                    newStatus: orderStatus.status,
                                    success: true,
                                });
                            }
                        } catch (orderError) {
                            console.error(`Error checking order ${order.id} status:`, orderError);
                            results.push({
                                supplierName: supplier.name,
                                orderId: order.id,
                                externalOrderId: order.externalOrderId,
                                success: false,
                                error: orderError instanceof Error ? orderError.message : String(orderError),
                            });
                        }
                    }
                } catch (supplierError) {
                    console.error(`Error checking orders for supplier ${supplier.name}:`, supplierError);
                    results.push({
                        supplierName: supplier.name,
                        orderId: "", // Empty string for orderId when it's a supplier-level error
                        externalOrderId: null,
                        success: false,
                        error: supplierError instanceof Error ? supplierError.message : String(supplierError),
                    });
                }
            }

            return {
                success: results.some(r => r.success),
                totalOrders: totalCount,
                updatedOrders: updatedCount,
                details: results,
            };
        } catch (error) {
            console.error("Error checking supplier order updates:", error);
            return {
                success: false,
                totalOrders: 0,
                updatedOrders: 0,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Update a supplier order status and related information
     */
    private static async updateSupplierOrderStatus(
        supplierOrderId: string,
        status: string,
        data: {
            trackingNumber?: string;
            trackingUrl?: string;
            carrier?: string;
            estimatedDelivery?: string;
        } = {}
    ) {
        // Map external statuses to our internal statuses if needed
        const statusMap: Record<string, string> = {
            "pending": "PENDING",
            "processing": "PROCESSING",
            "shipped": "SHIPPED",
            "delivered": "COMPLETED",
            "cancelled": "CANCELLED",
            "on_hold": "PENDING",
            "completed": "COMPLETED",
        };

        const normalizedStatus = statusMap[status.toLowerCase()] || status.toUpperCase();

        // Get the existing supplier order with its items
        const supplierOrder = await db.supplierOrder.findUnique({
            where: { id: supplierOrderId },
            include: {
                OrderItem: true,
            },
        });

        if (!supplierOrder) {
            throw new Error(`Supplier order ${supplierOrderId} not found`);
        }

        // Prepare update data
        const updateData: any = {
            status: normalizedStatus,
        };

        // Add tracking information if provided
        if (data.trackingNumber) {
            updateData.trackingNumber = data.trackingNumber;
        }

        if (data.trackingUrl) {
            updateData.trackingUrl = data.trackingUrl;
        }

        if (data.carrier) {
            updateData.carrier = data.carrier;
        }

        // Update estimated delivery if provided
        if (data.estimatedDelivery) {
            updateData.estimatedDelivery = new Date(data.estimatedDelivery);
        }

        // Update notes
        updateData.notes = `${supplierOrder.notes || ''}\nStatus updated to ${normalizedStatus} on ${new Date().toISOString()}`;

        // Update the supplier order
        await db.supplierOrder.update({
            where: { id: supplierOrderId },
            data: updateData,
        });

        // Update all linked order items
        await Promise.all(
            supplierOrder.OrderItem.map(async (item) => {
                await db.orderItem.update({
                    where: { id: item.id },
                    data: {
                        supplierOrderStatus: normalizedStatus,
                        supplierTrackingNumber: data.trackingNumber || supplierOrder.trackingNumber || null,
                        supplierTrackingUrl: data.trackingUrl || supplierOrder.trackingUrl || null,
                    },
                });
            })
        );

        // If status is SHIPPED or COMPLETED, update the related customer orders' fulfillment status
        if (
            (normalizedStatus === "SHIPPED" || normalizedStatus === "COMPLETED") &&
            (supplierOrder.status !== "SHIPPED" && supplierOrder.status !== "COMPLETED")
        ) {
            // Get unique order IDs from order items
            const orderIds = Array.from(
                new Set(supplierOrder.OrderItem.map((item) => item.orderId))
            );

            // For each order, check if all items are now fulfilled by supplier
            for (const orderId of orderIds) {
                // Get all items for this order
                const orderItems = await db.orderItem.findMany({
                    where: { orderId },
                });

                // Check if all items are now fulfilled (have a supplier order with status SHIPPED or COMPLETED)
                const allItemsFulfilled = orderItems.every(
                    (item) =>
                        item.supplierOrderId &&
                        (item.supplierOrderStatus === "SHIPPED" ||
                            item.supplierOrderStatus === "COMPLETED")
                );

                // If all items are fulfilled, update the order's fulfillment status
                if (allItemsFulfilled) {
                    await db.order.update({
                        where: { id: orderId },
                        data: {
                            fulfillmentStatus: "FULFILLED",
                        },
                    });
                } else {
                    // If only some items are fulfilled, mark as partially fulfilled
                    const someItemsFulfilled = orderItems.some(
                        (item) =>
                            item.supplierOrderId &&
                            (item.supplierOrderStatus === "SHIPPED" ||
                                item.supplierOrderStatus === "COMPLETED")
                    );

                    if (someItemsFulfilled) {
                        await db.order.update({
                            where: { id: orderId },
                            data: {
                                fulfillmentStatus: "PARTIALLY_FULFILLED",
                            },
                        });
                    }
                }
            }
        }

        return {
            success: true,
            status: normalizedStatus,
        };
    }
}