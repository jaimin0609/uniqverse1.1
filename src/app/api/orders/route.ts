import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const data = await req.json();

        // Validate required data
        if (!data.items || !data.items.length) {
            return NextResponse.json(
                { message: "No items provided" },
                { status: 400 }
            );
        }

        // Get user from session or allow guest checkout
        // Guest checkout is currently not supported, requiring login
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json(
                { message: "User authentication required" },
                { status: 401 }
            );
        }

        // Calculate order totals
        const subtotal = data.items.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        );

        // Calculate shipping cost based on method
        let shippingCost = 5; // Default to standard shipping
        if (data.shippingMethod === "express") {
            shippingCost = 12;
        } else if (data.shippingMethod === "overnight") {
            shippingCost = 25;
        }

        // Calculate tax (assume 8% tax rate)
        const taxRate = 0.08;
        const taxAmount = subtotal * taxRate;

        // Calculate total
        const total = subtotal + shippingCost + taxAmount;

        // Create a payment intent with Stripe
        const paymentResult = await createPaymentIntent(total);

        if (!paymentResult.success) {
            return NextResponse.json(
                { message: "Payment processing failed", error: paymentResult.error },
                { status: 400 }
            );
        }

        // Always create/get shipping address for the order
        let shippingAddressId: string | null = null;

        // Create the shipping address
        const newAddress = await db.address.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                address1: data.address,
                address2: data.apartment || "",
                city: data.city,
                state: data.state || "",
                postalCode: data.postalCode,
                country: data.country,
                phone: data.phone || "",
                type: "SHIPPING",
                userId,
                isDefault: false, // Only make it default if explicitly requested
                updatedAt: new Date(),
            },
        });
        shippingAddressId = newAddress.id;

        // If the customer wants to save this address for future use
        if (data.saveAddress) {
            // If they want it as default, update any existing default address
            if (data.isDefault) {
                // Remove default flag from any existing default address
                await db.address.updateMany({
                    where: {
                        userId,
                        type: "SHIPPING",
                        isDefault: true,
                    },
                    data: {
                        isDefault: false,
                    },
                });

                // Set this address as default
                await db.address.update({
                    where: { id: shippingAddressId },
                    data: { isDefault: true },
                });
            }
        }

        // Generate a unique order number
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        // Create order in database
        const order = await db.order.create({
            data: {
                orderNumber,
                userId,
                shippingAddressId,
                subtotal,
                tax: taxAmount,
                shipping: shippingCost,
                total,
                paymentMethod: "card", // Default to card for now
                paymentIntentId: paymentResult.paymentIntentId,
                paymentStatus: "PENDING",
                status: "PENDING",
                notes: data.notes || "",
            },
        });

        // Create order items
        for (const item of data.items) {
            await db.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    variantId: item.variantId || null,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                    updatedAt: new Date(),
                },
            });

            // Update product inventory (for both products and variants)
            if (item.variantId) {
                const variant = await db.productVariant.findUnique({
                    where: { id: item.variantId },
                });

                if (variant) {
                    await db.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            inventory: variant.inventory - item.quantity,
                        },
                    });

                    // Create inventory history record
                    await db.inventoryHistory.create({
                        data: {
                            id: uuidv4(),
                            productId: item.productId,
                            variantId: item.variantId,
                            previousValue: variant.inventory,
                            newValue: variant.inventory - item.quantity,
                            action: "ORDER_PLACED",
                            userId,
                        },
                    });
                }
            } else {
                const product = await db.product.findUnique({
                    where: { id: item.productId },
                });

                if (product) {
                    await db.product.update({
                        where: { id: item.productId },
                        data: {
                            inventory: product.inventory - item.quantity,
                        },
                    });

                    // Create inventory history record
                    await db.inventoryHistory.create({
                        data: {
                            id: uuidv4(),
                            productId: item.productId,
                            previousValue: product.inventory,
                            newValue: product.inventory - item.quantity,
                            action: "ORDER_PLACED",
                            userId,
                        },
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            clientSecret: paymentResult.clientSecret,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { message: "Error creating order", error: (error as Error).message },
            { status: 500 }
        );
    }
}