"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    CreditCard,
    Truck,
    Calendar,
    DollarSign,
    ShoppingBag,
    Eye,
    Mail,
    Phone,
    Info
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice, type Currency } from "@/lib/currency-utils";

interface OrderAddress {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
}

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
        id: string;
        name: string;
        images: Array<{
            url: string;
        }>;
    };
}

interface Customer {
    id: string;
    name: string;
    email: string;
}

interface VendorOrderDetail {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    vendorTotal: number;
    vendorItems: OrderItem[];
    createdAt: string;
    shippingAddress: OrderAddress;
    customer: Customer;
    currency?: Currency;
}

export default function VendorOrderDetailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const [order, setOrder] = useState<VendorOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currency, setCurrency] = useState<Currency>("USD");

    // Move useEffect before early return to fix React Hooks warning
    useEffect(() => {
        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }

        if (!params?.id) return;

        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/vendor/orders/${params.id}?currency=${currency}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch order");
                }
                const data = await response.json();
                setOrder(data.order);
            } catch (error) {
                console.error("Error fetching order:", error);
                toast.error("Failed to load order details");
                router.push("/vendor/orders");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [session, params?.id, router, currency]);

    // Function to update order status
    const updateOrderStatus = async (newStatus: string) => {
        if (!order) return;

        try {
            const response = await fetch(`/api/vendor/orders/${order.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            const data = await response.json();
            setOrder(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };

    if (!params?.id) {
        return null; // or redirect to vendor orders page
    }

    const orderId = params.id as string;

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
            PROCESSING: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
            SHIPPED: { variant: "default" as const, color: "bg-indigo-100 text-indigo-800" },
            DELIVERED: { variant: "default" as const, color: "bg-green-100 text-green-800" },
            COMPLETED: { variant: "default" as const, color: "bg-green-100 text-green-800" },
            CANCELLED: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

        return (
            <Badge variant={config.variant} className={config.color}>
                {status}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
            PAID: { variant: "default" as const, color: "bg-green-100 text-green-800" },
            FAILED: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
            REFUNDED: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

        return (
            <Badge variant={config.variant} className={config.color}>
                {status}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
                    <Link href="/vendor/orders">
                        <Button>Back to Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/vendor/orders">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
                        <p className="text-gray-600">
                            Placed on {format(new Date(order.createdAt), "PPP 'at' p")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <ShoppingBag className="h-5 w-5 mr-2" />
                                Your Products in this Order
                            </CardTitle>
                            <CardDescription>
                                {order.vendorItems.length} product{order.vendorItems.length !== 1 ? 's' : ''} from your catalog
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.vendorItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {item.product.images.length > 0 && (
                                                        <img
                                                            src={item.product.images[0].url}
                                                            alt={item.product.name}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <Link
                                                            href={`/vendor/products/${item.product.id}/edit`}
                                                            className="font-medium text-blue-600 hover:underline"
                                                        >
                                                            {item.product.name}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                {formatPrice(item.price, order.currency || currency)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatPrice(item.total, order.currency || currency)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Separator className="my-4" />

                            {/* Commission Information Alert */}
                            <Alert className="mb-4">
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Your Earnings:</strong> This amount reflects your commission after platform fees have been deducted from the total sale amount.
                                </AlertDescription>
                            </Alert>

                            <div className="flex justify-end">
                                <div className="space-y-2 w-64">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Sale Value:</span>
                                        <span className="text-sm">
                                            {formatPrice(order.vendorItems.reduce((sum, item) => sum + item.total, 0), order.currency || currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-2">
                                        <span className="text-sm font-medium text-gray-900">Your Net Earnings:</span>
                                        <span className="font-bold text-green-600">
                                            {formatPrice(order.vendorTotal, order.currency || currency)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-right">
                                        After platform commission & fees
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MapPin className="h-5 w-5 mr-2" />
                                Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <p className="font-medium">
                                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                </p>
                                {order.shippingAddress.company && (
                                    <p className="text-gray-600">{order.shippingAddress.company}</p>
                                )}
                                <p className="text-gray-600">{order.shippingAddress.address1}</p>
                                {order.shippingAddress.address2 && (
                                    <p className="text-gray-600">{order.shippingAddress.address2}</p>
                                )}
                                <p className="text-gray-600">
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                </p>
                                <p className="text-gray-600">{order.shippingAddress.country}</p>
                                {order.shippingAddress.phone && (
                                    <p className="text-gray-600 flex items-center gap-1 mt-2">
                                        <Phone className="h-4 w-4" />
                                        {order.shippingAddress.phone}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Order Number</span>
                                <span className="font-medium">{order.orderNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Order Date</span>
                                <span className="font-medium">
                                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status</span>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment</span>
                                {getPaymentStatusBadge(order.paymentStatus)}
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Your Revenue</span>
                                <span className="font-bold text-lg">${order.vendorTotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{order.customer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{order.customer.email}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Update Order Status
                            </CardTitle>
                            <CardDescription>
                                Change the status of this order to keep your customer informed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {/*
                                    { status: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
                                    { status: "PROCESSING", label: "Processing", color: "bg-blue-100 text-blue-800" },
                                    { status: "SHIPPED", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
                                    { status: "DELIVERED", label: "Delivered", color: "bg-green-100 text-green-800" },
                                    { status: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
                                ].map((item) => (
                                    <Button
                                        key={item.status}
                                        variant={order.status === item.status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateOrderStatus(item.status)}
                                        disabled={order.status === item.status}
                                        className={order.status === item.status ? item.color : ""}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                                */}
                                <Button
                                    variant={order.status === "PENDING" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateOrderStatus("PENDING")}
                                    disabled={order.status === "PENDING"}
                                    className={order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : ""}
                                >
                                    Pending
                                </Button>
                                <Button
                                    variant={order.status === "PROCESSING" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateOrderStatus("PROCESSING")}
                                    disabled={order.status === "PROCESSING"}
                                    className={order.status === "PROCESSING" ? "bg-blue-100 text-blue-800" : ""}
                                >
                                    Processing
                                </Button>
                                <Button
                                    variant={order.status === "SHIPPED" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateOrderStatus("SHIPPED")}
                                    disabled={order.status === "SHIPPED"}
                                    className={order.status === "SHIPPED" ? "bg-indigo-100 text-indigo-800" : ""}
                                >
                                    Shipped
                                </Button>
                                <Button
                                    variant={order.status === "DELIVERED" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateOrderStatus("DELIVERED")}
                                    disabled={order.status === "DELIVERED"}
                                    className={order.status === "DELIVERED" ? "bg-green-100 text-green-800" : ""}
                                >
                                    Delivered
                                </Button>
                                <Button
                                    variant={order.status === "CANCELLED" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateOrderStatus("CANCELLED")}
                                    disabled={order.status === "CANCELLED"}
                                    className={order.status === "CANCELLED" ? "bg-red-100 text-red-800" : ""}
                                >
                                    Cancelled
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
