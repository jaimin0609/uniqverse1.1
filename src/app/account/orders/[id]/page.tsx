'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Package,
    ArrowLeft,
    Truck,
    CreditCard,
    Clock,
    AlertTriangle,
    Loader2,
    Download,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ClientPrice } from '@/components/ui/client-price';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface OrderDetail {
    id: string;
    orderNumber: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    trackingNumber: string | null;
    trackingUrl: string | null;
    items: OrderItem[];
    shippingAddress: Address | null;
    billingAddress: Address | null;
}

interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    total: number;
    product: {
        id: string;
        name: string;
        slug: string;
        featuredImage: string | null;
        sku: string | null;
    };
    options: { name: string; value: string }[];
}

interface Address {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
}

export default function OrderDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!session) return;

            setIsLoading(true);
            try {
                const response = await fetch(`/api/users/orders/${orderId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Order not found');
                    }
                    throw new Error('Failed to fetch order details');
                }

                const data = await response.json();
                setOrder(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching order details');
                console.error('Error fetching order details:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchOrderDetails();
        }
    }, [session, orderId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const cancelOrder = async () => {
        if (!order) return;

        setIsCancelling(true);
        try {
            const response = await fetch(`/api/users/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel order');
            }

            const updatedOrder = await response.json();
            setOrder(updatedOrder);
            setShowCancelDialog(false);
            toast.success('Order cancelled successfully');
        } catch (err: any) {
            console.error('Error cancelling order:', err);
            toast.error(err.message || 'Failed to cancel order');
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Loading order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-lg text-center">
                <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" asChild>
                    <Link href="/account/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
                <Package className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Order Not Found</h3>
                <p className="text-yellow-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button variant="outline" asChild>
                    <Link href="/account/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'delivered':
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'processing':
            case 'pending':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'cancelled':
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/account/orders">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
                    <p className="text-gray-500">
                        {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-1`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge className={`${getStatusColor(order.paymentStatus)} text-xs px-2 py-1`}>
                        Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items - Left side (wider) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                            <CardDescription>
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-5">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row items-start border-b pb-5 last:border-none last:pb-0"
                                    >
                                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded mr-4 mb-2">
                                            {item.product.featuredImage ? (
                                                <img
                                                    src={item.product.featuredImage}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex flex-col sm:flex-row sm:justify-between">
                                                <div>
                                                    <h4 className="font-medium">
                                                        <Link
                                                            href={`/products/${item.product.slug}`}
                                                            className="hover:text-blue-600 hover:underline"
                                                        >
                                                            {item.product.name}
                                                        </Link>
                                                    </h4>
                                                    {item.options && item.options.length > 0 && (
                                                        <p className="text-sm text-gray-500">
                                                            {item.options.map((option) => (
                                                                <span key={option.name}>
                                                                    {option.name}: {option.value}
                                                                    <br />
                                                                </span>
                                                            ))}
                                                        </p>
                                                    )}
                                                    {item.product.sku && (
                                                        <p className="text-xs text-gray-500">
                                                            SKU: {item.product.sku}
                                                        </p>
                                                    )}
                                                </div>                                                <div className="mt-2 sm:mt-0 text-right">
                                                    <div className="text-gray-700">
                                                        <ClientPrice amount={item.price} /> x {item.quantity}
                                                    </div>
                                                    <div className="font-medium">
                                                        <ClientPrice amount={item.total} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Shipping Address */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-lg">
                                    <Truck className="mr-2 h-5 w-5" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.shippingAddress ? (
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium">{order.shippingAddress.name}</p>
                                        <p>{order.shippingAddress.line1}</p>
                                        {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                                        <p>
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                        </p>
                                        <p>{order.shippingAddress.country}</p>
                                        {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No shipping address provided</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Billing Address */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-lg">
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Billing Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.billingAddress ? (
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium">{order.billingAddress.name}</p>
                                        <p>{order.billingAddress.line1}</p>
                                        {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                                        <p>
                                            {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                                        </p>
                                        <p>{order.billingAddress.country}</p>
                                        {order.billingAddress.phone && <p>Phone: {order.billingAddress.phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Same as shipping address</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Summary and Tracking - Right side */}
                <div className="space-y-6">
                    {/* Tracking Info */}
                    {order.trackingNumber && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-lg">
                                    <Truck className="mr-2 h-5 w-5" />
                                    Tracking Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tracking Number</p>
                                    <p className="font-mono">{order.trackingNumber}</p>
                                </div>
                                {order.trackingUrl && (
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Track Package
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Summary */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">                            <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span><ClientPrice amount={order.subtotal} /></span>
                        </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">Shipping</span>
                                <span><ClientPrice amount={order.shippingCost} /></span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax</span>
                                <span><ClientPrice amount={order.tax} /></span>
                            </div>

                            {order.discount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-red-600">-<ClientPrice amount={order.discount} /></span>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span><ClientPrice amount={order.total} /></span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Payment Method</span>
                                <span>{order.paymentMethod}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Timeline */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-lg">
                                <Clock className="mr-2 h-5 w-5" />
                                Order Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="relative pl-6 pb-4 border-l border-gray-200">
                                    <div className="absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full bg-green-500"></div>
                                    <p className="font-medium">Order Placed</p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>

                                {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                                    <div className="relative pl-6 pb-4 border-l border-gray-200">
                                        <div className={`absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full ${order.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                                        <p className="font-medium">Processing</p>
                                        <p className="text-sm text-gray-500">Order confirmation and processing</p>
                                    </div>
                                )}

                                {(order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                                    <div className="relative pl-6 pb-4 border-l border-gray-200">
                                        <div className={`absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full ${order.status === 'SHIPPED' ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                                        <p className="font-medium">Shipped</p>
                                        <p className="text-sm text-gray-500">
                                            {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Your order has been shipped'}
                                        </p>
                                    </div>
                                )}

                                {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                                    <div className="relative pl-6 border-l border-gray-200">
                                        <div className={`absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full ${order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        <p className="font-medium">Delivered</p>
                                        <p className="text-sm text-gray-500">Your order has been delivered</p>
                                    </div>
                                )}

                                {order.status === 'CANCELLED' && (
                                    <div className="relative pl-6 border-l border-gray-200">
                                        <div className="absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full bg-red-500"></div>
                                        <p className="font-medium">Cancelled</p>
                                        <p className="text-sm text-gray-500">Your order has been cancelled</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Order Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Only show cancel button if order can be cancelled */}
                            {['PENDING', 'PROCESSING'].includes(order.status) && (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 hover:bg-red-50"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    Cancel Order
                                </Button>
                            )}

                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/help">
                                    Contact Support
                                </Link>
                            </Button>

                            {['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/returns">
                                        Return or Exchange
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cancel Order Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-start bg-amber-50 p-3 rounded-md text-amber-800 gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Please note:</p>
                            <ul className="list-disc ml-4 mt-1">
                                <li>Orders in "Pending" or "Processing" status can be cancelled.</li>
                                <li>If payment was already processed, it will be refunded to your original payment method.</li>
                                <li>Refunds may take 3-5 business days to appear on your statement.</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isCancelling}
                        >
                            Never mind
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={cancelOrder}
                            disabled={isCancelling}
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}