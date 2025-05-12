"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import CartSummary from "@/components/checkout/cart-summary";
import ShippingForm from "@/components/checkout/shipping-form";
import PaymentForm from "@/components/checkout/payment-form";
import OrderComplete from "@/components/checkout/order-complete";
import { CouponInput } from "@/components/checkout/coupon-input";
import { CheckCircle, ShoppingBag, Truck, CreditCard } from "lucide-react";

// Define checkout steps
type CheckoutStep = "cart" | "shipping" | "payment" | "complete";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalItems, clearCart } = useCartStore();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
    const [shippingData, setShippingData] = useState<any>({});
    const [orderData, setOrderData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponCode, setCouponCode] = useState<string | null>(null);

    // Safely handle hydration and redirection with a delay
    useEffect(() => {
        // On initial mount, wait for proper hydration
        const timer = setTimeout(() => {
            setIsLoading(false);

            // Only redirect if the cart is definitely empty and we're not at the complete step
            if (items.length === 0 && currentStep !== "complete") {
                router.push("/shop");
            }
        }, 1000); // Longer delay to ensure hydration completes

        return () => clearTimeout(timer);
    }, [items, currentStep, router]);

    // Calculate subtotal, shipping, tax and total
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const getShippingCost = () => {
        if (!shippingData?.shippingMethod) return 0;
        switch (shippingData.shippingMethod) {
            case "express": return 12;
            case "overnight": return 25;
            default: return 5; // standard shipping
        }
    };

    const handleApplyCoupon = (amount: number, code: string) => {
        setDiscountAmount(amount);
        setCouponCode(code);
    };

    const handleRemoveCoupon = () => {
        setDiscountAmount(0);
        setCouponCode(null);
    }; const shippingCost = getShippingCost();
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    // Handle shipping form submission
    const handleShippingSubmit = (data: any) => {
        setShippingData(data);
        setCurrentStep("payment"); // Move to payment step
        window.scrollTo(0, 0);
    };

    // Handle payment submission
    const handlePaymentSubmit = async (paymentData: any) => {
        setIsProcessing(true);
        try {
            // Store payment data and order details with cart items and shipping data
            setOrderData({
                orderId: paymentData.orderId,
                orderNumber: paymentData.orderNumber,
                items: [...items], // Save the items before clearing the cart
                shippingAddress: shippingData, // Save shipping information
                total: total,
                shippingCost: shippingCost,
                taxAmount: taxAmount,
                subtotal: subtotal,
                discount: discountAmount,
                discountCode: couponCode
            });

            // Clear the cart
            clearCart();

            // Move to complete step
            setCurrentStep("complete");
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Payment error:", error);
            alert("There was a problem processing your payment. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine which step content to show
    const renderStepContent = () => {
        switch (currentStep) {
            case "cart":
                return (
                    <div className="space-y-6">
                        <CartSummary items={items} />

                        <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount ({couponCode})</span>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 my-2 pt-2">
                                    <div className="flex justify-between font-medium">
                                        <span>Total</span>
                                        <span>${(subtotal - discountAmount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <CouponInput
                                onApplyCoupon={handleApplyCoupon}
                                onRemoveCoupon={handleRemoveCoupon}
                                subtotal={subtotal}
                            />

                            <div className="mt-6">
                                <Button
                                    onClick={() => setCurrentStep("shipping")}
                                    disabled={items.length === 0}
                                    className="w-full text-base"
                                >
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case "shipping":
                return (
                    <ShippingForm onSubmit={handleShippingSubmit} />
                );
            case "payment":
                return (
                    <PaymentForm
                        onSubmit={handlePaymentSubmit}
                        isProcessing={isProcessing}
                        shippingData={shippingData}
                    />
                );
            case "complete":
                return (
                    <OrderComplete
                        orderId={orderData?.orderId}
                        orderNumber={orderData?.orderNumber}
                        items={orderData?.items}
                        shippingAddress={orderData?.shippingAddress}
                        total={orderData?.total}
                        subtotal={orderData?.subtotal}
                        shippingCost={orderData?.shippingCost}
                        taxAmount={orderData?.taxAmount}
                    />
                );
            default:
                return null;
        }
    };

    // Render checkout steps indicator
    const renderCheckoutSteps = () => {
        const steps = [
            { id: "cart", label: "Cart", icon: <ShoppingBag size={20} /> },
            { id: "shipping", label: "Shipping", icon: <Truck size={20} /> },
            { id: "payment", label: "Payment", icon: <CreditCard size={20} /> },
            { id: "complete", label: "Complete", icon: <CheckCircle size={20} /> },
        ];

        return (
            <div className="flex justify-between items-center mb-8">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === step.id
                                ? "bg-blue-600 text-white"
                                : steps.findIndex(s => s.id === currentStep) > index
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                        >
                            {steps.findIndex(s => s.id === currentStep) > index ? (
                                <CheckCircle size={20} />
                            ) : (
                                step.icon
                            )}
                        </div>
                        <span
                            className={`ml-2 text-sm hidden sm:inline ${currentStep === step.id
                                ? "font-medium text-blue-600"
                                : steps.findIndex(s => s.id === currentStep) > index
                                    ? "font-medium text-green-500"
                                    : "text-gray-500"
                                }`}
                        >
                            {step.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px bg-gray-300 mx-4 hidden sm:block" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // If still loading (pre-hydration) show nothing to avoid flickering
    if (isLoading) {
        return (
            <div className="container mx-auto py-10 px-4 min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading checkout...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            {/* Checkout Steps Indicator */}
            {renderCheckoutSteps()}

            {/* Step Content */}
            {items.length === 0 && currentStep !== "complete" ? (
                <div className="text-center py-10">
                    <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
                    <p className="mb-6 text-gray-600">Add items to your cart to continue shopping.</p>
                    <Link href="/shop">
                        <Button>Continue Shopping</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">{renderStepContent()}</div>

                    {/* Order Summary - Hidden on complete step */}
                    {currentStep !== "complete" && (
                        <div className="lg:col-span-4">
                            <div className="bg-white p-6 rounded-lg border">
                                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                                <div className="space-y-3 mb-4">
                                    {/* Order Items Summary */}
                                    <p className="text-gray-600">
                                        {items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? "item" : "items"} in cart
                                    </p>

                                    <div className="border-t pt-3">
                                        <div className="flex justify-between mb-2">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span>Shipping</span>
                                            <span>
                                                {currentStep === "cart"
                                                    ? "Calculated at next step"
                                                    : `$${shippingCost.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span>Tax</span>
                                            <span>${taxAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-medium text-lg mt-3 border-t pt-3">
                                            <span>Total</span>
                                            <span>
                                                ${currentStep === "cart"
                                                    ? (subtotal + taxAmount).toFixed(2)
                                                    : total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}