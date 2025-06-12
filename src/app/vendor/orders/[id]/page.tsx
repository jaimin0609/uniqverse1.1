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
    Phone
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
}

export default function VendorOrderDetailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<VendorOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/vendor/orders/${orderId}`);
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

        if (orderId) {
            fetchOrder();
        }
    }, [orderId, session, router]);

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
                                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${item.total.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Separator className="my-4" />

                            <div className="flex justify-end">
                                <div className="space-y-2 w-48">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Your portion:</span>
                                        <span className="font-medium">${order.vendorTotal.toFixed(2)}</span>
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
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.print()}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Print Order Details
                            </Button>
                            <Link href={`/vendor/products`} className="block">
                                <Button variant="outline" className="w-full">
                                    <Package className="h-4 w-4 mr-2" />
                                    View Products
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
