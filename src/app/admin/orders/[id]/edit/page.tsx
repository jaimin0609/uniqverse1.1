"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ShoppingBag,
    ArrowLeft,
    User,
    Save,
    Trash2,
    Loader2,
    AlertTriangle,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

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
    shippingAddress: AddressData | null;
    billingAddress: AddressData | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
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

export default function EditOrderPage() {
    const { id: orderId } = useParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        status: "",
        paymentStatus: "",
        notes: "",
        trackingNumber: "",
        trackingUrl: "",
        shippingCost: 0,
        discount: 0,
        shippingAddress: {
            name: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            phone: "",
        },
        billingAddress: {
            name: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            phone: "",
        },
    });

    // Fetch order data
    useEffect(() => {
        const fetchOrderData = async () => {
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

                // Initialize form data with current order data
                setFormData({
                    status: data.status || "",
                    paymentStatus: data.paymentStatus || "",
                    notes: data.notes || "",
                    trackingNumber: data.trackingNumber || "",
                    trackingUrl: data.trackingUrl || "",
                    shippingCost: data.shippingCost || 0,
                    discount: data.discount || 0,
                    shippingAddress: data.shippingAddress ? {
                        name: data.shippingAddress.name || "",
                        line1: data.shippingAddress.line1 || "",
                        line2: data.shippingAddress.line2 || "",
                        city: data.shippingAddress.city || "",
                        state: data.shippingAddress.state || "",
                        postalCode: data.shippingAddress.postalCode || "",
                        country: data.shippingAddress.country || "",
                        phone: data.shippingAddress.phone || "",
                    } : {
                        name: "",
                        line1: "",
                        line2: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "",
                        phone: "",
                    },
                    billingAddress: data.billingAddress ? {
                        name: data.billingAddress.name || "",
                        line1: data.billingAddress.line1 || "",
                        line2: data.billingAddress.line2 || "",
                        city: data.billingAddress.city || "",
                        state: data.billingAddress.state || "",
                        postalCode: data.billingAddress.postalCode || "",
                        country: data.billingAddress.country || "",
                        phone: data.billingAddress.phone || "",
                    } : {
                        name: "",
                        line1: "",
                        line2: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "",
                        phone: "",
                    }
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

    // Handle form changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Handle nested fields
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            const parentKey = parent as keyof typeof formData;
            const parentValue = formData[parentKey];
            
            // Ensure parentValue is an object before spreading
            if (parentValue && typeof parentValue === 'object') {
                setFormData({
                    ...formData,
                    [parent]: {
                        ...parentValue,
                        [child]: value
                    }
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    // Handle select changes
    const handleSelectChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Save order changes
    const handleSaveOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update order");
            }

            toast.success("Order updated successfully");
            router.push(`/admin/orders/${orderId}`);
        } catch (err: any) {
            console.error("Error updating order:", err);
            toast.error(err.message || "Failed to update order");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete order
    const handleDeleteOrder = async () => {
        if (!order) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete order");
            }

            toast.success("Order deleted successfully");
            router.push("/admin/orders");
        } catch (err: any) {
            console.error("Error deleting order:", err);
            toast.error(err.message || "Failed to delete order");
        } finally {
            setIsSaving(false);
            setShowDeleteConfirm(false);
        }
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
        <div>
            {/* Header with back button and actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-2">
                        <Link href={`/admin/orders/${orderId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Order Details
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Order #{order.orderNumber}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Order
                    </Button>
                    <Button onClick={handleSaveOrder} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveOrder}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Order Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Status</CardTitle>
                                <CardDescription>Manage the current order status and payment information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Order Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange("status", value)}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
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

                                <div className="space-y-2">
                                    <Label htmlFor="paymentStatus">Payment Status</Label>
                                    <Select
                                        value={formData.paymentStatus}
                                        onValueChange={(value) => handleSelectChange("paymentStatus", value)}
                                    >
                                        <SelectTrigger id="paymentStatus">
                                            <SelectValue placeholder="Select payment status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="PAID">Paid</SelectItem>
                                            <SelectItem value="FAILED">Failed</SelectItem>
                                            <SelectItem value="REFUNDED">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Notes</CardTitle>
                                <CardDescription>Internal notes for this order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Enter notes about this order..."
                                    rows={5}
                                />
                            </CardContent>
                        </Card>

                        {/* Shipping & Tracking */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping & Tracking</CardTitle>
                                <CardDescription>Manage tracking information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trackingNumber">Tracking Number</Label>
                                    <Input
                                        id="trackingNumber"
                                        name="trackingNumber"
                                        value={formData.trackingNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter tracking number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="trackingUrl">Tracking URL</Label>
                                    <Input
                                        id="trackingUrl"
                                        name="trackingUrl"
                                        value={formData.trackingUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/track/..."
                                    />
                                    <p className="text-xs text-gray-500">The URL where customers can track this package</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financials */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Details</CardTitle>
                                <CardDescription>Manage shipping costs and discounts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                                    <Input
                                        id="shippingCost"
                                        name="shippingCost"
                                        type="number"
                                        step="0.01"
                                        value={formData.shippingCost}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount ($)</Label>
                                    <Input
                                        id="discount"
                                        name="discount"
                                        type="number"
                                        step="0.01"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping Address</CardTitle>
                                <CardDescription>Update the shipping address for this order</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shippingAddress.name">Full Name</Label>
                                    <Input
                                        id="shippingAddress.name"
                                        name="shippingAddress.name"
                                        value={formData.shippingAddress?.name || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shippingAddress.line1">Address Line 1</Label>
                                    <Input
                                        id="shippingAddress.line1"
                                        name="shippingAddress.line1"
                                        value={formData.shippingAddress?.line1 || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shippingAddress.line2">Address Line 2</Label>
                                    <Input
                                        id="shippingAddress.line2"
                                        name="shippingAddress.line2"
                                        value={formData.shippingAddress?.line2 || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="shippingAddress.city">City</Label>
                                        <Input
                                            id="shippingAddress.city"
                                            name="shippingAddress.city"
                                            value={formData.shippingAddress?.city || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="shippingAddress.state">State/Province</Label>
                                        <Input
                                            id="shippingAddress.state"
                                            name="shippingAddress.state"
                                            value={formData.shippingAddress?.state || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="shippingAddress.postalCode">Postal Code</Label>
                                        <Input
                                            id="shippingAddress.postalCode"
                                            name="shippingAddress.postalCode"
                                            value={formData.shippingAddress?.postalCode || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="shippingAddress.country">Country</Label>
                                        <Input
                                            id="shippingAddress.country"
                                            name="shippingAddress.country"
                                            value={formData.shippingAddress?.country || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shippingAddress.phone">Phone Number</Label>
                                    <Input
                                        id="shippingAddress.phone"
                                        name="shippingAddress.phone"
                                        value={formData.shippingAddress?.phone || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Billing Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Address</CardTitle>
                                <CardDescription>Update the billing address for this order</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="billingAddress.name">Full Name</Label>
                                    <Input
                                        id="billingAddress.name"
                                        name="billingAddress.name"
                                        value={formData.billingAddress?.name || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billingAddress.line1">Address Line 1</Label>
                                    <Input
                                        id="billingAddress.line1"
                                        name="billingAddress.line1"
                                        value={formData.billingAddress?.line1 || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billingAddress.line2">Address Line 2</Label>
                                    <Input
                                        id="billingAddress.line2"
                                        name="billingAddress.line2"
                                        value={formData.billingAddress?.line2 || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="billingAddress.city">City</Label>
                                        <Input
                                            id="billingAddress.city"
                                            name="billingAddress.city"
                                            value={formData.billingAddress?.city || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="billingAddress.state">State/Province</Label>
                                        <Input
                                            id="billingAddress.state"
                                            name="billingAddress.state"
                                            value={formData.billingAddress?.state || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="billingAddress.postalCode">Postal Code</Label>
                                        <Input
                                            id="billingAddress.postalCode"
                                            name="billingAddress.postalCode"
                                            value={formData.billingAddress?.postalCode || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="billingAddress.country">Country</Label>
                                        <Input
                                            id="billingAddress.country"
                                            name="billingAddress.country"
                                            value={formData.billingAddress?.country || ""}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billingAddress.phone">Phone Number</Label>
                                    <Input
                                        id="billingAddress.phone"
                                        name="billingAddress.phone"
                                        value={formData.billingAddress?.phone || ""}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteOrder} disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete Order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}