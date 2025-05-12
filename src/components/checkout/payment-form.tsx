"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { formatCurrency } from "@/utils/format";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

// Load Stripe outside of component render to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

// Define the payment form schema
const paymentFormSchema = z.object({
    cardholderName: z.string().min(3, "Cardholder name must be at least 3 characters"),
    // Note: We don't validate card details here because Stripe Element handles that
    savePaymentInfo: z.boolean().optional(),
});

// Country name to ISO 2-letter code mapping
const countryToCode = {
    "United States": "US",
    "Canada": "CA",
    "United Kingdom": "GB",
    "Australia": "AU",
    "Germany": "DE",
    "France": "FR",
    "Japan": "JP",
    // Add more countries as needed
};

// Convert full country name to 2-letter code or return the input if it's already a code
const getCountryCode = (country: string): string => {
    // If it's already a 2-letter code, return it
    if (country.length === 2 && /^[A-Z]{2}$/.test(country)) {
        return country;
    }

    // Look up the code in our mapping
    return countryToCode[country] || country;
};

// Define payment error messages for better user feedback
const getPaymentErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
        'card_declined': 'Your card was declined. Please try a different card.',
        'expired_card': 'Your card has expired. Please try a different card.',
        'incorrect_cvc': 'The security code (CVC) is incorrect. Please check and try again.',
        'processing_error': 'An error occurred while processing your card. Please try again.',
        'insufficient_funds': 'Your card has insufficient funds. Please try a different card.',
        'authentication_required': 'Your card requires authentication. Please complete the verification process.',
        'invalid_request_error': 'The payment request was invalid. Please contact customer support.',
        'rate_limit_error': 'Too many requests made to the API too quickly. Please try again later.',
        'api_connection_error': 'Network communication with payment processor failed. Please try again.',
        'api_error': 'An error occurred with our payment processor. Please try again later.',
        'stripe_js_not_loaded': 'The payment system failed to load. Please refresh the page and try again.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again or use a different payment method.';
};

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
    onSubmit: (data: any) => void;
    isProcessing: boolean;
    shippingData: any;
}

function PaymentFormContent({ onSubmit, isProcessing, shippingData }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [cardError, setCardError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [paymentAttempts, setPaymentAttempts] = useState(0);
    const { items, clearCart } = useCartStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            cardholderName: "",
            savePaymentInfo: false,
        },
    });

    // Calculate shipping cost based on method
    const getShippingCost = () => {
        switch (shippingData?.shippingMethod) {
            case "express": return 12;
            case "overnight": return 25;
            default: return 5; // standard shipping
        }
    };

    // Calculate subtotal from cart items
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = getShippingCost();
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + shippingCost + taxAmount;

    // Handle 3DS authentication if needed
    const handlePaymentIntentResult = async (paymentIntent: any, orderId: string, orderNumber: string, data: PaymentFormValues) => {
        switch (paymentIntent.status) {
            case 'succeeded':
                // Payment succeeded, process order
                handleSuccessfulPayment(orderId, orderNumber, paymentIntent.id, data);
                break;

            case 'processing':
                // Payment is still processing
                toast.info("Your payment is processing. We'll update you when it's complete.", {
                    duration: 6000,
                });
                handleProcessingPayment(orderId, orderNumber, paymentIntent.id, data);
                break;

            case 'requires_payment_method':
                // Previous payment attempt failed, allow retry
                toast.error("The previous payment attempt failed. Please try again with a different payment method.", {
                    duration: 6000,
                });
                setCardError("Your payment was declined. Please try a different card.");
                setProcessing(false);
                setPaymentAttempts(prev => prev + 1);
                break;

            case 'requires_action':
            case 'requires_confirmation':
                // 3D Secure authentication needed
                toast.info("Additional authentication required. Please complete the verification process.", {
                    duration: 4000,
                });
                const { error, paymentIntent: updatedIntent } = await stripe!.confirmCardPayment(paymentIntent.client_secret);

                if (error) {
                    setCardError(getPaymentErrorMessage(error.code || 'api_error'));
                    await cancelPaymentForOrder(orderId);
                } else {
                    // Check the status of the payment after authentication
                    handlePaymentIntentResult(updatedIntent, orderId, orderNumber, data);
                }
                break;

            case 'canceled':
                // Payment was canceled
                toast.error("The payment was canceled. Please try again.", {
                    duration: 4000,
                });
                setCardError("The payment process was canceled. Please try again.");
                await cancelPaymentForOrder(orderId);
                break;

            default:
                // Unknown status
                toast.error(`Unexpected payment status: ${paymentIntent.status}. Please contact support.`, {
                    duration: 6000,
                });
                setCardError(`Unexpected payment status: ${paymentIntent.status}`);
                await cancelPaymentForOrder(orderId);
                break;
        }
    };

    // Handle successful payment
    const handleSuccessfulPayment = (orderId: string, orderNumber: string, paymentIntentId: string, data: PaymentFormValues) => {
        // Call onSubmit with the order info
        onSubmit({
            orderId,
            orderNumber,
            paymentIntentId,
            cardholderName: data.cardholderName,
            savePaymentInfo: data.savePaymentInfo,
        });

        // Clear the cart after successful payment
        clearCart();

        // Show success message
        toast.success("Payment successful! Your order is being processed.", {
            duration: 5000,
        });
    };

    // Handle processing payment
    const handleProcessingPayment = (orderId: string, orderNumber: string, paymentIntentId: string, data: PaymentFormValues) => {
        // Call onSubmit with the order info but mark as processing
        onSubmit({
            orderId,
            orderNumber,
            paymentIntentId,
            cardholderName: data.cardholderName,
            savePaymentInfo: data.savePaymentInfo,
            status: 'processing'
        });
    };

    // Cancel payment for an order
    const cancelPaymentForOrder = async (orderId: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/cancel-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                console.error("Failed to cancel payment for order:", orderId);
            }

            setProcessing(false);
        } catch (error) {
            console.error("Error canceling payment:", error);
            setProcessing(false);
        }
    };

    const handleFormSubmit = async (data: PaymentFormValues) => {
        if (!stripe || !elements) {
            setCardError("Payment system not loaded. Please refresh the page.");
            return;
        }

        setProcessing(true);
        setCardError(null);

        try {
            // Create the order first to get the client secret
            const orderData = {
                ...shippingData,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    variantId: item.variantId || null,
                })),
                saveAddress: !!shippingData.saveAddress,
                paymentAttempt: paymentAttempts + 1, // Track payment attempts for fraud prevention
            };

            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            const orderResult = await orderResponse.json();

            if (!orderResponse.ok) {
                throw new Error(orderResult.message || "Error creating order");
            }

            // Get the client secret
            const { clientSecret, orderId, orderNumber } = orderResult;

            if (!clientSecret) {
                throw new Error("No client secret returned");
            }

            // Get card element
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error("Card element not found");
            }

            // Convert country to 2-letter code for Stripe
            const countryCode = getCountryCode(shippingData.country);

            // Confirm the payment with the client secret
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: data.cardholderName,
                            email: shippingData.email,
                            address: {
                                city: shippingData.city,
                                country: countryCode,
                                line1: shippingData.address,
                                line2: shippingData.apartment || '',
                                postal_code: shippingData.postalCode,
                                state: shippingData.state,
                            },
                        },
                    },
                    setup_future_usage: data.savePaymentInfo ? 'off_session' : undefined,
                }
            );

            if (confirmError) {
                throw new Error(getPaymentErrorMessage(confirmError.code || 'processing_error'));
            }

            // Handle the payment intent result (including 3DS flow if necessary)
            await handlePaymentIntentResult(paymentIntent, orderId, orderNumber, data);

        } catch (error) {
            console.error("Payment error:", error);
            setCardError((error as Error).message || "There was an error processing your payment");
            setProcessing(false);

            // Increment payment attempts counter for tracking failed attempts
            setPaymentAttempts(prev => prev + 1);

            // Show error toast
            toast.error((error as Error).message || "Payment failed. Please try again.", {
                duration: 5000,
            });
        }
    };

    const handleRetry = () => {
        setCardError(null);
        reset({
            cardholderName: "",
            savePaymentInfo: false
        });

        // Clear the card element
        const cardElement = elements?.getElement(CardElement);
        if (cardElement) {
            cardElement.clear();
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-medium mb-3">Order Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping ({shippingData?.shippingMethod || "standard"})</span>
                                <span>{formatCurrency(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>{formatCurrency(taxAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t mt-2 font-medium">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                        <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name*
                        </label>
                        <input
                            type="text"
                            id="cardholderName"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register("cardholderName")}
                        />
                        {errors.cardholderName && (
                            <p className="mt-1 text-sm text-red-600">{errors.cardholderName.message}</p>
                        )}
                    </div>

                    {/* Card Details */}
                    <div>
                        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-1">
                            Card Details*
                        </label>
                        <div className="p-2.5 border border-gray-300 rounded-md">
                            <CardElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                        invalid: {
                                            color: '#9e2146',
                                        },
                                    },
                                }}
                            />
                        </div>
                        {cardError && (
                            <div className="mt-2">
                                <p className="text-sm text-red-600 mb-2">{cardError}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRetry}
                                    className="text-xs"
                                >
                                    Try Again with Different Card
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Save Payment Info */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="savePaymentInfo"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            {...register("savePaymentInfo")}
                        />
                        <label htmlFor="savePaymentInfo" className="ml-2 block text-sm text-gray-700">
                            Save payment information for future purchases
                        </label>
                    </div>

                    {/* Shipping Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium">Shipping to:</h3>
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => router.back()}
                            >
                                Edit
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>{`${shippingData?.firstName} ${shippingData?.lastName}`}</p>
                            <p>{shippingData?.address}</p>
                            {shippingData?.apartment && <p>{shippingData.apartment}</p>}
                            <p>
                                {`${shippingData?.city}, ${shippingData?.state} ${shippingData?.postalCode}`}
                            </p>
                            <p>{shippingData?.country}</p>
                        </div>
                    </div>

                    {/* Security Information */}
                    <div className="text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        All payment information is encrypted and processed securely. We never store your full card details.
                    </div>

                    {/* Form Buttons */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Return to Shipping
                        </Button>
                        <Button
                            type="submit"
                            disabled={!stripe || isProcessing || processing}
                            className="px-8"
                        >
                            {isProcessing || processing ? "Processing..." : `Pay ${formatCurrency(total)}`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Wrapper component that provides Stripe context
export default function PaymentForm(props: PaymentFormProps) {
    return (
        <Elements stripe={stripePromise}>
            <PaymentFormContent {...props} />
        </Elements>
    );
}