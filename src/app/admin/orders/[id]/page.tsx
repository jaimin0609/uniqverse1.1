"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ShoppingBag,
    ArrowLeft,
    User,
    MapPin,
    CreditCard,
    Truck,
    Package,
    Clock,
    Edit,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Printer,
    Send,
    Download,
    FileEdit,
    Tag,
    ChevronDown,
    FileText,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import PrintableInvoice from "@/components/admin/PrintableInvoice";
import PrintableShippingLabel from "@/components/admin/PrintableShippingLabel";

interface OrderData {
    id: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
    };
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    items: OrderItemData[];
    shippingAddress: AddressData;
    billingAddress: AddressData;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    fulfillmentStatus: string;
}

interface OrderItemData {
    id: string;
    product: {
        id: string;
        name: string;
        slug: string;
        featuredImage: string | null;
        sku: string;
    };
    quantity: number;
    price: number;
    total: number;
    options: {
        name: string;
        value: string;
    }[];
}

interface AddressData {
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
    const params = useParams<{ id: string }>();
    const orderId = params?.id;
    const router = useRouter();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showNoteDialog, setShowNoteDialog] = useState(false);
    const [showTrackingDialog, setShowTrackingDialog] = useState(false);
    const [orderNote, setOrderNote] = useState("");
    const [trackingInfo, setTrackingInfo] = useState({
        trackingNumber: "",
        trackingUrl: ""
    });    // Printing refs
    const invoiceRef = useRef<HTMLDivElement>(null);
    const shippingLabelRef = useRef<HTMLDivElement>(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [showShippingLabel, setShowShippingLabel] = useState(false);

    // Timeout tracking for memory leak prevention
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    // Cleanup function to clear all timeouts
    const clearAllTimeouts = () => {
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
        timeoutRefs.current = [];
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => clearAllTimeouts();
    }, []);

    const companyInfo = {
        name: "Uniqverse",
        address: "123 Commerce Street",
        city: "Melbourne",
        postalCode: "3000",
        country: "Australia",
        email: "support@uniqverse.com",
        phone: "+61 3 1234 5678",
        website: "www.uniqverse.com"
    };    // Fetch order data
    useEffect(() => {
        const fetchOrderData = async () => {
            if (!orderId) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/orders/${orderId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Order not found");
                    }
                    throw new Error("Failed to fetch order data");
                }

                const data = await response.json();
                setOrder(data);
                setOrderNote(data.notes || "");
                setTrackingInfo({
                    trackingNumber: data.trackingNumber || "",
                    trackingUrl: data.trackingUrl || ""
                });
            } catch (err: any) {
                console.error("Error fetching order data:", err);
                setError(err.message || "Failed to load order data");
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchOrderData();
        }
    }, [orderId]);

    // Early return if no orderId is available
    if (!orderId) {
        return (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Invalid Order</h3>
                <p className="text-yellow-600 mb-4">No order ID was provided.</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }    // Update order status
    const updateOrderStatus = async (status: string) => {
        if (!order || !orderId) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error("Failed to update order status");
            }

            const data = await response.json();
            setOrder(data);
            toast.success(`Order status updated to ${status}`);
        } catch (err: any) {
            console.error("Error updating order status:", err);
            toast.error(err.message || "Failed to update order status");
        } finally {
            setIsUpdating(false);
        }
    };

    // Update payment status
    const updatePaymentStatus = async (paymentStatus: string) => {
        if (!order) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update payment status");
            }

            const data = await response.json();
            setOrder(data);
            toast.success(`Payment status updated to ${paymentStatus}`);
        } catch (err: any) {
            console.error("Error updating payment status:", err);
            toast.error(err.message || "Failed to update payment status");
        } finally {
            setIsUpdating(false);
        }
    };

    // Update fulfillment status
    const updateFulfillmentStatus = async (fulfillmentStatus: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fulfillmentStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update fulfillment status");
            }

            const updatedOrder = await response.json();
            setOrder(updatedOrder);
            toast.success("Fulfillment status updated successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to update fulfillment status");
        }
    };

    // Save order note
    const saveOrderNote = async () => {
        if (!order) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ notes: orderNote }),
            });

            if (!response.ok) {
                throw new Error("Failed to save order note");
            }

            const data = await response.json();
            setOrder(data);
            setShowNoteDialog(false);
            toast.success("Order note saved");
        } catch (err: any) {
            console.error("Error saving order note:", err);
            toast.error(err.message || "Failed to save order note");
        } finally {
            setIsUpdating(false);
        }
    };

    // Save tracking information
    const saveTrackingInfo = async () => {
        if (!order) return;

        // Validate inputs before sending
        if (!trackingInfo.trackingNumber.trim()) {
            toast.error("Please enter a tracking number");
            return;
        }

        setIsUpdating(true);
        try {
            console.log("Saving tracking info:", trackingInfo); // Debug log

            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    trackingNumber: trackingInfo.trackingNumber.trim(),
                    trackingUrl: trackingInfo.trackingUrl.trim(),
                    // Also update fulfillment status to SHIPPED if it's UNFULFILLED
                    ...(order.fulfillmentStatus === "UNFULFILLED" && { fulfillmentStatus: "SHIPPED" })
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(errorData.error || "Failed to save tracking information");
            }

            const data = await response.json();
            setOrder(data);
            setShowTrackingDialog(false);
            toast.success("Tracking information saved successfully");
        } catch (err: any) {
            console.error("Error saving tracking information:", err);
            toast.error(err.message || "Failed to save tracking information");
        } finally {
            setIsUpdating(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Print order
    const printOrder = () => {
        window.print();
    };

    // Send order confirmation
    const sendOrderConfirmation = async () => {
        if (!order) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/send-confirmation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                throw new Error("Failed to send order confirmation");
            }

            toast.success("Order confirmation sent to customer");
        } catch (err: any) {
            console.error("Error sending order confirmation:", err);
            toast.error(err.message || "Failed to send order confirmation");
        } finally {
            setIsUpdating(false);
        }
    }; const handlePrintInvoice = () => {
        setShowInvoice(true);
        const timeout = setTimeout(() => {
            if (invoiceRef.current) {
                const originalContents = document.body.innerHTML;
                const printContents = invoiceRef.current.innerHTML;
                document.body.innerHTML = printContents;
                window.print();
                document.body.innerHTML = originalContents;
                setShowInvoice(false);
                // Re-run any initialization scripts that might be needed
                window.location.reload();
            }
        }, 200);
        timeoutRefs.current.push(timeout);
    };

    const handlePrintShippingLabel = () => {
        if (!order?.shippingAddress) {
            toast.error("No shipping address available to print label");
            return;
        } setShowShippingLabel(true);
        const timeout = setTimeout(() => {
            if (shippingLabelRef.current) {
                const originalContents = document.body.innerHTML;
                const printContents = shippingLabelRef.current.innerHTML;
                document.body.innerHTML = printContents;
                window.print();
                document.body.innerHTML = originalContents;
                setShowShippingLabel(false);
                // Re-run any initialization scripts that might be needed
                window.location.reload();
            }
        }, 200);
        timeoutRefs.current.push(timeout);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="bg-yellow-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700">Order not found</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    asChild
                >
                    <Link href="/admin/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <div>
                {/* Header with back button and actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <Button variant="ghost" asChild className="mb-2">
                            <Link href="/admin/orders">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Orders
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
                        <p className="text-gray-500">
                            {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrintInvoice}>
                            <FileText className="mr-2 h-4 w-4" />
                            Print Invoice
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrintShippingLabel}
                            disabled={!order.shippingAddress}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Shipping Label
                        </Button>
                        <Button size="sm" variant="outline" onClick={sendOrderConfirmation}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Confirmation
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Order
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Order Status Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Order Status</p>
                        <div className="flex items-center gap-3">
                            <Badge variant={
                                order.status === "DELIVERED" ? "success" :
                                    order.status === "PROCESSING" ? "warning" :
                                        order.status === "SHIPPED" ? "default" :
                                            order.status === "CANCELLED" ? "destructive" :
                                                "outline"
                            } className="text-sm py-1 px-2">
                                {order.status}
                            </Badge>
                            <Select
                                disabled={isUpdating}
                                value={order.status}
                                onValueChange={updateOrderStatus}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Update Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Payment Status</p>
                        <div className="flex items-center gap-3">
                            <Badge variant={
                                order.paymentStatus === "PAID" ? "success" :
                                    order.paymentStatus === "PENDING" ? "warning" :
                                        order.paymentStatus === "FAILED" ? "destructive" :
                                            order.paymentStatus === "REFUNDED" ? "outline" :
                                                "default"
                            } className="text-sm py-1 px-2">
                                {order.paymentStatus}
                            </Badge>
                            <Select
                                disabled={isUpdating}
                                value={order.paymentStatus}
                                onValueChange={updatePaymentStatus}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Update Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Fulfillment Status</p>
                        <div className="flex items-center gap-3">
                            <Badge variant={
                                order.fulfillmentStatus === "FULFILLED" ? "success" :
                                    order.fulfillmentStatus === "UNFULFILLED" ? "warning" :
                                        order.fulfillmentStatus === "PARTIALLY_FULFILLED" ? "default" :
                                            order.fulfillmentStatus === "SHIPPED" ? "default" :
                                                order.fulfillmentStatus === "DELIVERED" ? "success" :
                                                    order.fulfillmentStatus === "RETURNED" ? "destructive" :
                                                        order.fulfillmentStatus === "RESTOCKED" ? "default" :
                                                            "outline"
                            } className="text-sm py-1 px-2">
                                {order.fulfillmentStatus}
                            </Badge>
                            <Select
                                disabled={isUpdating}
                                value={order.fulfillmentStatus}
                                onValueChange={updateFulfillmentStatus}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Update Fulfillment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNFULFILLED">Unfulfilled</SelectItem>
                                    <SelectItem value="PARTIALLY_FULFILLED">Partially Fulfilled</SelectItem>
                                    <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    <SelectItem value="RETURNED">Returned</SelectItem>
                                    <SelectItem value="RESTOCKED">Restocked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Order Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Customer Info & Order Notes */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Customer</CardTitle>
                                <CardDescription>Customer information and details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 mr-3">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{order.customer.name || 'Unnamed Customer'}</p>
                                        <p className="text-sm text-gray-500">{order.customer.email}</p>
                                    </div>
                                </div>

                                {order.customer.phone && (
                                    <div className="text-sm bg-gray-50 p-2 rounded-md">
                                        <span className="font-medium">Phone: </span>
                                        {order.customer.phone}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href={`/admin/customers/${order.customer.id}`}>
                                        <User className="mr-2 h-4 w-4" />
                                        View Customer Profile
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Order Notes */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Order Notes</CardTitle>
                                <CardDescription>Internal notes for this order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {order.notes ? (
                                    <div className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{order.notes}</div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Clock className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No notes for this order yet</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" onClick={() => setShowNoteDialog(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4" />
                                    {order.notes ? 'Edit Note' : 'Add Note'}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Tracking Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Shipping & Tracking</CardTitle>
                                <CardDescription>Tracking and shipping details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {order.trackingNumber ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">Tracking Number:</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-sm font-mono">{order.trackingNumber}</p>
                                            {order.trackingUrl && (
                                                <a
                                                    href={order.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                                >
                                                    Track Package →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Truck className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No tracking information added</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" onClick={() => setShowTrackingDialog(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4" />
                                    {order.trackingNumber ? 'Update Tracking' : 'Add Tracking'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Order Items</CardTitle>
                                <CardDescription>Products included in this order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Options</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-center w-16">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                                            {item.product.featuredImage ? (
                                                                <img
                                                                    src={item.product.featuredImage}
                                                                    alt={item.product.name}
                                                                    className="h-full w-full object-cover rounded"
                                                                />
                                                            ) : (
                                                                <Package className="h-5 w-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{item.product.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.options.length > 0 ? (
                                                        <div className="text-xs">
                                                            {item.options.map((option, index) => (
                                                                <span key={index} className="block">
                                                                    <span className="font-medium">{option.name}:</span> {option.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Order Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Order Summary</CardTitle>
                                <CardDescription>Financial summary of the order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>${order.subtotal.toFixed(2)}</span>
                                    </div>

                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Discount</span>
                                            <span className="text-red-600">-${order.discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span>${order.shippingCost.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tax</span>
                                        <span>${order.tax.toFixed(2)}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between font-medium">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Payment Method</span>
                                        <span>{order.paymentMethod}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Shipping Address */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Shipping Address</CardTitle>
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
                                        <p className="text-sm text-muted-foreground">No shipping address provided</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Billing Address */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Billing Address</CardTitle>
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
                                        <div className="text-sm text-gray-500">
                                            No billing address provided
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Order Note Dialog */}
                <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{order.notes ? 'Edit Order Note' : 'Add Order Note'}</DialogTitle>
                            <DialogDescription>
                                This note is for internal use and won't be visible to the customer.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            rows={5}
                            placeholder="Enter order notes here..."
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveOrderNote} disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Note"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Tracking Dialog */}
                <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{order.trackingNumber ? 'Update Tracking Information' : 'Add Tracking Information'}</DialogTitle>
                            <DialogDescription>
                                Enter the shipping carrier's tracking details for this order.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    value={trackingInfo.trackingNumber}
                                    onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
                                    placeholder="Enter tracking number"
                                    className="mb-3"
                                />
                                <div className="space-y-2">
                                    <Input
                                        value={trackingInfo.trackingUrl}
                                        onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingUrl: e.target.value })}
                                        placeholder="Enter tracking URL (https://...)"
                                        className="mb-1"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Examples:<br />
                                        USPS: https://tools.usps.com/go/TrackConfirmAction?tLabels=<br />
                                        UPS: https://www.ups.com/track?tracknum=<br />
                                        FedEx: https://www.fedex.com/apps/fedextrack/?tracknumbers=<br />
                                        DHL: https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTrackingDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveTrackingInfo} disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Tracking"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Hidden Print Components */}
            <div style={{ display: showInvoice ? 'block' : 'none' }} className="hidden">
                <PrintableInvoice ref={invoiceRef} order={order} companyInfo={companyInfo} />
            </div>
            <div style={{ display: showShippingLabel ? 'block' : 'none' }} className="hidden">
                <PrintableShippingLabel ref={shippingLabelRef} order={order} companyInfo={companyInfo} />
            </div>
        </>
    );
}