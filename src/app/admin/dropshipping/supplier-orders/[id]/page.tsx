"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    RefreshCw,
    RotateCw,
    ExternalLink,
    Send,
    PackageCheck,
    Clock,
    Truck,
    FileText
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SupplierOrderDetail {
    id: string;
    orderNumber: string;
    supplierName: string;
    orderDate: string;
    status: string;
    totalCost: number;
    shippingCost: number;
    trackingNumber: string | null;
    trackingUrl: string | null;
    carrier: string | null;
    externalOrderId: string | null;
    estimatedDelivery: string | null;
    notes: string | null;
    errorMessage: string | null;
    items: OrderItem[];
    supplier: {
        id: string;
        name: string;
        website: string | null;
        apiEndpoint: string | null;
        contactEmail: string | null;
    };
    customerOrders: {
        id: string;
        orderNumber: string;
        customerName: string;
        status: string;
    }[];
}

interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    supplierProductId: string | null;
    quantity: number;
    price: number;
    variantName: string | null;
    variantOptions: Record<string, string> | null;
    customerOrderId: string;
    customerOrderNumber: string;
}

export default function SupplierOrderDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [order, setOrder] = useState<SupplierOrderDetail | null>(null);
    const [notesValue, setNotesValue] = useState("");
    const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchOrderDetails();
        }
    }, [params.id]);

    useEffect(() => {
        if (order?.notes) {
            setNotesValue(order.notes);
        }
    }, [order?.notes]);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/supplier-orders/${params.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch supplier order details");
            }
            const data = await response.json();
            setOrder(data.order || null);
        } catch (error) {
            console.error("Error fetching supplier order details:", error);
            toast.error("Failed to load order details");
        } finally {
            setIsLoading(false);
        }
    };

    const refreshOrderStatus = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`/api/admin/supplier-orders/${params.id}/check-status`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to refresh order status");
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Order status updated");
                fetchOrderDetails(); // Refresh order details after update
            } else {
                toast.error(`Failed to update status: ${result.error}`);
            }
        } catch (error) {
            console.error("Error refreshing order status:", error);
            toast.error("Failed to check for order status updates");
        } finally {
            setIsRefreshing(false);
        }
    };

    const sendOrderToSupplier = async () => {
        setIsSending(true);
        try {
            const response = await fetch(`/api/admin/supplier-orders/${params.id}/send`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to send order to supplier");
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Order successfully sent to supplier");
                fetchOrderDetails(); // Refresh order details after sending
            } else {
                toast.error(`Failed to send order: ${result.error}`);
            }
        } catch (error) {
            console.error("Error sending order to supplier:", error);
            toast.error("Failed to send order to supplier");
        } finally {
            setIsSending(false);
        }
    };

    const saveNotes = async () => {
        setIsUpdatingNotes(true);
        try {
            const response = await fetch(`/api/admin/supplier-orders/${params.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notes: notesValue
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update notes");
            }

            toast.success("Notes updated successfully");
        } catch (error) {
            console.error("Error updating notes:", error);
            toast.error("Failed to update notes");
        } finally {
            setIsUpdatingNotes(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case "PENDING":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
            case "PROCESSING":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
            case "SHIPPED":
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
            case "COMPLETED":
                return <Badge variant="success" className="bg-green-500">Completed</Badge>;
            case "CANCELLED":
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center h-[500px]">
                <RotateCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-center text-gray-500 mb-4">
                            Order not found or has been deleted
                        </div>
                        <Button onClick={() => router.push('/admin/dropshipping/supplier-orders')}>
                            Back to Orders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin/dropshipping/supplier-orders')}
                        className="mr-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>
                    <h1 className="text-2xl font-bold">Supplier Order: {order.orderNumber}</h1>
                </div>
                <div className="flex space-x-2">
                    {order.status === "PENDING" && !order.externalOrderId && order.supplier.apiEndpoint && (
                        <Button
                            onClick={sendOrderToSupplier}
                            disabled={isSending}
                            size="sm"
                        >
                            {isSending ? (
                                <>
                                    <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> Send to Supplier
                                </>
                            )}
                        </Button>
                    )}

                    {(order.status === "PROCESSING" || order.status === "SHIPPED") && order.externalOrderId && (
                        <Button
                            onClick={refreshOrderStatus}
                            disabled={isRefreshing}
                            variant="outline"
                            size="sm"
                        >
                            {isRefreshing ? (
                                <>
                                    <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Check Status
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl">{getStatusBadge(order.status)}</div>
                        {order.externalOrderId && (
                            <div className="text-xs text-gray-500 mt-2">
                                External ID: {order.externalOrderId}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Supplier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-medium">{order.supplier.name}</div>
                        {order.supplier.website && (
                            <a
                                href={order.supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 flex items-center mt-1"
                            >
                                {order.supplier.website.replace(/(^\w+:|^)\/\//, '')}
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Date & Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">${order.totalCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-2">
                            Order Date: {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                            Shipping: ${order.shippingCost.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {order.trackingNumber ? (
                                <>
                                    <div className="flex items-center">
                                        <Truck className="h-5 w-5 mr-2 text-indigo-500" />
                                        <span className="font-medium">Tracking Number:</span>
                                        <span className="ml-2">{order.trackingNumber}</span>
                                    </div>

                                    {order.trackingUrl && (
                                        <div className="ml-7">
                                            <a
                                                href={order.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 text-sm flex items-center"
                                            >
                                                Track Shipment
                                                <ExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                        </div>
                                    )}

                                    {order.carrier && (
                                        <div className="flex items-center">
                                            <PackageCheck className="h-5 w-5 mr-2 text-indigo-500" />
                                            <span className="font-medium">Carrier:</span>
                                            <span className="ml-2">{order.carrier}</span>
                                        </div>
                                    )}

                                    {order.estimatedDelivery && (
                                        <div className="flex items-center">
                                            <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                                            <span className="font-medium">Estimated Delivery:</span>
                                            <span className="ml-2">
                                                {new Date(order.estimatedDelivery).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-gray-500 italic">
                                    No shipping information available yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Related Customer Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {order.customerOrders.length === 0 ? (
                            <div className="text-gray-500 italic">No customer orders associated</div>
                        ) : (
                            <div className="space-y-3">
                                {order.customerOrders.map(customerOrder => (
                                    <div key={customerOrder.id} className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <div className="font-medium">#{customerOrder.orderNumber}</div>
                                            <div className="text-sm text-gray-500">{customerOrder.customerName}</div>
                                        </div>
                                        <div className="flex space-x-2 items-center">
                                            {getStatusBadge(customerOrder.status)}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => router.push(`/admin/orders/${customerOrder.id}`)}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="items" className="w-full">
                <TabsList>
                    <TabsTrigger value="items">Order Items</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Logs</TabsTrigger>
                    {order.errorMessage && (
                        <TabsTrigger value="errors">Errors</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="items">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                            <CardDescription>
                                {order.items.length} items in this supplier order
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Supplier ID</TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Customer Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.productName}
                                            </TableCell>
                                            <TableCell>{item.productSku}</TableCell>
                                            <TableCell>
                                                {item.supplierProductId || (
                                                    <span className="text-xs text-red-500">Missing</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.variantName || "N/A"}
                                                {item.variantOptions && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {Object.entries(item.variantOptions).map(([key, value]) => (
                                                            <div key={key}>
                                                                {key}: {value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>${item.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 h-auto"
                                                    onClick={() => router.push(`/admin/orders/${item.customerOrderId}`)}
                                                >
                                                    #{item.customerOrderNumber}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes & Logs</CardTitle>
                            <CardDescription>
                                Add private notes or view system logs for this order
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <label className="text-sm font-medium mb-2 block">
                                    Order Notes
                                </label>
                                <Textarea
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    placeholder="Add notes about this supplier order..."
                                    rows={5}
                                    className="resize-none w-full"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t px-6 py-4">
                            <Button
                                onClick={saveNotes}
                                disabled={isUpdatingNotes}
                            >
                                {isUpdatingNotes ? "Saving..." : "Save Notes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {order.errorMessage && (
                    <TabsContent value="errors">
                        <Card>
                            <CardHeader className="text-red-500">
                                <FileText className="h-5 w-5 mb-1" />
                                <CardTitle>Error Information</CardTitle>
                                <CardDescription>
                                    Errors encountered when processing this order
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
                                    {order.errorMessage}
                                </div>
                                <div className="mt-4 text-sm text-gray-500">
                                    If this error persists, try the following:
                                    <ul className="list-disc pl-5 mt-2">
                                        <li>Check the supplier API credentials in supplier settings</li>
                                        <li>Verify that product IDs are correctly mapped to supplier product IDs</li>
                                        <li>Contact the supplier directly to resolve any issues</li>
                                        <li>Try sending the order manually by clicking "Send to Supplier"</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}