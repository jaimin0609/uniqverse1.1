"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    Truck,
    ShoppingBag,
    AlertCircle,
    Clock,
    RefreshCw,
    XCircle
} from "lucide-react";

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'ON_HOLD';

interface OrderDetails {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingAddress?: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    createdAt: string;
    paidAt?: string;
    cancelledAt?: string;
    trackingNumber?: string;
    trackingUrl?: string;
}

interface OrderCompleteProps {
    orderId?: string;
    orderNumber?: string;
    items?: any[]; // Add items prop
    shippingAddress?: any; // Add shipping address prop
    total?: number;
    subtotal?: number;
    shippingCost?: number;
    taxAmount?: number;
}

export default function OrderComplete({ orderId, orderNumber, items = [], shippingAddress, total, subtotal, shippingCost, taxAmount }: OrderCompleteProps) {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // Fetch order details when component loads
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrderDetails(data);

                    // If payment is still pending, set up polling to check status
                    if (data.paymentStatus === 'PENDING') {
                        // Only set up polling if it's not already in progress
                        if (!pollingInterval) {
                            const interval = setInterval(() => {
                                fetchOrderDetails();
                            }, 5000); // Poll every 5 seconds
                            setPollingInterval(interval);
                        }
                    } else if (pollingInterval) {
                        // Clear polling if payment is no longer pending
                        clearInterval(pollingInterval);
                        setPollingInterval(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();

        // Clean up polling interval on unmount
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [orderId, pollingInterval]);

    // Estimated delivery date (7 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
    const deliveryDateFormatted = estimatedDeliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    // Get the appropriate status information based on payment and order status
    const getStatusInfo = () => {
        if (!orderDetails) return { icon: null, title: "", description: "", color: "" };

        const { paymentStatus, status } = orderDetails;

        switch (paymentStatus) {
            case 'PAID':
                return {
                    icon: <CheckCircle size={32} />,
                    title: "Order Confirmed!",
                    description: "Thank you for your purchase. We are processing your order now.",
                    color: "green",
                    paymentStatusDisplay: "Paid",
                    paymentStatusClass: "bg-green-100 text-green-800",
                    orderStatusDisplay: "Processing",
                    orderStatusClass: "bg-blue-100 text-blue-800"
                };
            case 'PENDING':
                return {
                    icon: <Clock size={32} />,
                    title: "Payment Processing",
                    description: "Your payment is being processed. We'll update you when it's complete.",
                    color: "yellow",
                    paymentStatusDisplay: "Processing",
                    paymentStatusClass: "bg-yellow-100 text-yellow-800",
                    orderStatusDisplay: "Pending",
                    orderStatusClass: "bg-gray-100 text-gray-800"
                };
            case 'FAILED':
                return {
                    icon: <AlertCircle size={32} />,
                    title: "Payment Failed",
                    description: "There was an issue with your payment. Please try again or use a different payment method.",
                    color: "red",
                    paymentStatusDisplay: "Failed",
                    paymentStatusClass: "bg-red-100 text-red-800",
                    orderStatusDisplay: "On Hold",
                    orderStatusClass: "bg-orange-100 text-orange-800"
                };
            case 'CANCELLED':
                return {
                    icon: <XCircle size={32} />,
                    title: "Payment Cancelled",
                    description: "This payment was cancelled. You can place a new order if you'd like to try again.",
                    color: "gray",
                    paymentStatusDisplay: "Cancelled",
                    paymentStatusClass: "bg-gray-100 text-gray-800",
                    orderStatusDisplay: "Cancelled",
                    orderStatusClass: "bg-gray-100 text-gray-800"
                };
            case 'REFUNDED':
                return {
                    icon: <RefreshCw size={32} />,
                    title: "Order Refunded",
                    description: "Your order has been refunded. The funds should appear in your account soon.",
                    color: "blue",
                    paymentStatusDisplay: "Refunded",
                    paymentStatusClass: "bg-blue-100 text-blue-800",
                    orderStatusDisplay: "Refunded",
                    orderStatusClass: "bg-blue-100 text-blue-800"
                };
            case 'PARTIALLY_REFUNDED':
                return {
                    icon: <RefreshCw size={32} />,
                    title: "Order Partially Refunded",
                    description: "Your order has been partially refunded. Contact us if you have any questions.",
                    color: "blue",
                    paymentStatusDisplay: "Partially Refunded",
                    paymentStatusClass: "bg-blue-100 text-blue-800",
                    orderStatusDisplay: status === "PROCESSING" ? "Processing" : status,
                    orderStatusClass: "bg-blue-100 text-blue-800"
                };
            default:
                return {
                    icon: <CheckCircle size={32} />,
                    title: "Order Received",
                    description: "Thank you for your order. We'll update you on its status.",
                    color: "blue",
                    paymentStatusDisplay: paymentStatus,
                    paymentStatusClass: "bg-gray-100 text-gray-800",
                    orderStatusDisplay: status,
                    orderStatusClass: "bg-gray-100 text-gray-800"
                };
        }
    };

    const statusInfo = getStatusInfo();
    const statusColorClasses = {
        green: "bg-green-100 text-green-600",
        yellow: "bg-yellow-100 text-yellow-600",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
        gray: "bg-gray-100 text-gray-600"
    };

    // Get the action button based on payment status
    const getActionButton = () => {
        if (!orderDetails) return null;

        switch (orderDetails.paymentStatus) {
            case 'FAILED':
                return (
                    <Link href="/checkout" className="flex-1">
                        <Button className="w-full bg-red-600 hover:bg-red-700">
                            Try Payment Again
                        </Button>
                    </Link>
                );
            case 'CANCELLED':
                return (
                    <Link href="/shop" className="flex-1">
                        <Button className="w-full">
                            Start New Order
                        </Button>
                    </Link>
                );
            default:
                return (
                    <Link href={`/account/orders/${orderId}`} className="flex-1">
                        <Button className="w-full">View Order Details</Button>
                    </Link>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border">
            <div className="text-center mb-8">
                <div className={`h-16 w-16 ${statusColorClasses[statusInfo.color as keyof typeof statusColorClasses]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {statusInfo.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{statusInfo.title}</h2>
                <p className="text-gray-600">
                    {statusInfo.description}
                </p>
            </div>

            {/* Order Information */}
            <div className="border rounded-md p-4 mb-6">
                <h3 className="font-medium mb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Order Number</p>
                        <p className="font-medium">{orderDetails?.orderNumber || orderNumber || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">
                            {orderDetails?.createdAt
                                ? new Date(orderDetails.createdAt).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Payment Status</p>
                        <p className={`${statusInfo.paymentStatusClass || "bg-green-100 text-green-800"} px-2 py-0.5 rounded-full text-xs inline-block`}>
                            {statusInfo.paymentStatusDisplay || "Paid"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Order Status</p>
                        <p className={`${statusInfo.orderStatusClass || "bg-blue-100 text-blue-800"} px-2 py-0.5 rounded-full text-xs inline-block`}>
                            {statusInfo.orderStatusDisplay || "Processing"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Purchased Products - Show regardless of order status */}
            {items && items.length > 0 && (
                <div className="mb-8">
                    <h3 className="font-medium mb-4">Purchased Products</h3>
                    <div className="border rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item: any, index: number) => (
                                        <tr key={`${item.id}-${index}`}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Subtotal</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${subtotal?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Shipping</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${shippingCost?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Tax</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${taxAmount?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Total</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">${total?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Only show shipping information for paid orders */}
            {orderDetails?.paymentStatus !== 'FAILED' && orderDetails?.paymentStatus !== 'CANCELLED' && (
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium">Shipping Information</h3>
                            <p className="text-sm text-gray-600">
                                {orderDetails?.trackingNumber
                                    ? `Tracking: ${orderDetails.trackingNumber}`
                                    : `Estimated delivery by ${deliveryDateFormatted}`}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="animate-pulse h-20 bg-gray-100 rounded-md"></div>
                    ) : orderDetails?.shippingAddress ? (
                        <div className="text-sm text-gray-600 border rounded-md p-4">
                            <p className="font-medium">
                                {orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}
                            </p>
                            <p>{orderDetails.shippingAddress.address1}</p>
                            {orderDetails.shippingAddress.address2 && <p>{orderDetails.shippingAddress.address2}</p>}
                            <p>
                                {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postalCode}
                            </p>
                            <p>{orderDetails.shippingAddress.country}</p>
                        </div>
                    ) : shippingAddress ? (
                        <div className="text-sm text-gray-600 border rounded-md p-4">
                            <p className="font-medium">
                                {shippingAddress.firstName} {shippingAddress.lastName}
                            </p>
                            <p>{shippingAddress.address || shippingAddress.address1}</p>
                            {(shippingAddress.apartment || shippingAddress.address2) && (
                                <p>{shippingAddress.apartment || shippingAddress.address2}</p>
                            )}
                            <p>
                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                            </p>
                            <p>{shippingAddress.country}</p>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 border rounded-md p-4">
                            <p>Shipping address information will be displayed here.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Order Tracking or Next Steps */}
            <div className="bg-gray-50 p-4 rounded-md mb-8">
                <h3 className="font-medium mb-2">
                    {orderDetails?.paymentStatus === 'PAID' ? "Track Your Order" : "Next Steps"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    {orderDetails?.paymentStatus === 'PAID'
                        ? "A confirmation email has been sent to your email address with order details and tracking information."
                        : orderDetails?.paymentStatus === 'PENDING'
                            ? "We're still processing your payment. You'll receive an email once the payment is confirmed."
                            : orderDetails?.paymentStatus === 'FAILED'
                                ? "Your payment could not be processed. Please try again with a different payment method."
                                : orderDetails?.paymentStatus === 'CANCELLED'
                                    ? "This order has been cancelled. You can place a new order from our store."
                                    : "We've sent an email with details about your order."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    {getActionButton()}
                    <Link href="/shop" className="flex-1">
                        <Button variant="outline" className="w-full">
                            <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Customer Support */}
            <div className="text-sm text-gray-600 text-center">
                <p>
                    Questions about your order? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact our customer support</Link>
                </p>
            </div>
        </div>
    );
}