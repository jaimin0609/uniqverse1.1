"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Mail,
    Calendar,
    ShoppingBag,
    CreditCard,
    Edit,
    Trash2,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    MapPin,
    Phone,
    Clock,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface CustomerData {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
    role: string;
    orders: OrderData[];
    addresses: AddressData[];
}

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    paymentStatus: string;
    items: number;
}

interface AddressData {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
    isDefault: boolean;
    type: string;
}

export default function CustomerDetailPage() {
    const params = useParams<{ id: string }>();
    const customerId = params?.id;
    const router = useRouter();
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Fetch customer data
    useEffect(() => {
        const fetchCustomerData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/customers/${customerId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Customer not found");
                    }
                    throw new Error("Failed to fetch customer data");
                }

                const data = await response.json();
                setCustomer(data);
            } catch (err: any) {
                console.error("Error fetching customer data:", err);
                setError(err.message || "Failed to load customer data");
            } finally {
                setIsLoading(false);
            }
        };

        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);    // Handle customer deletion
    const deleteCustomer = async () => {
        if (!customerId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/customers/${customerId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete customer");
            }

            toast.success("Customer deleted successfully");
            router.push("/admin/customers");
        } catch (err: any) {
            console.error("Error deleting customer:", err);
            toast.error(err.message || "Failed to delete customer");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    // Early return if no customerId is available
    if (!customerId) {
        return (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Invalid Customer</h3>
                <p className="text-yellow-600 mb-4">No customer ID was provided.</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/customers">Back to Customers</Link>
                </Button>
            </div>
        );
    }

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

    if (!customer) {
        return (
            <div className="bg-yellow-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700">Customer not found</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    asChild
                >
                    <Link href="/admin/customers">Back to Customers</Link>
                </Button>
            </div>
        );
    }

    return (
        <div>
            {/* Header with back button and actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Button variant="ghost" asChild className="mb-2">
                        <Link href="/admin/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{customer.name || 'Unnamed User'}</h1>
                    <p className="text-gray-500">{customer.email}</p>
                </div>

                <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/customers/${customerId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Customer data content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Customer summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                            <CardDescription>Personal details and preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 mr-3">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">{customer.name || 'Unnamed User'}</p>
                                    <p className="text-sm text-gray-500">{customer.role}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{customer.email}</span>
                                </div>
                                {customer.phone && (
                                    <div className="flex items-center text-sm">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Joined {format(new Date(customer.createdAt), "MMMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Last updated {format(new Date(customer.updatedAt), "MMMM d, yyyy")}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" asChild className="w-full">
                                <Link href={`/admin/customers/${customerId}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Information
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Activity</CardTitle>
                            <CardDescription>Order history and spending</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-500">Total Orders</div>
                                    <div className="flex items-center mt-1">
                                        <ShoppingBag className="h-4 w-4 text-blue-500 mr-1" />
                                        <span className="text-2xl font-bold">{customer.orders.length}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-500">Total Spent</div>
                                    <div className="flex items-center mt-1">
                                        <CreditCard className="h-4 w-4 text-green-500 mr-1" />
                                        <span className="text-2xl font-bold">
                                            ${customer.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
                                <div className="space-y-2">
                                    {customer.orders.length > 0 ? (
                                        customer.orders
                                            .slice(0, 3)
                                            .map(order => (
                                                <div key={order.id} className="bg-gray-50 p-2 rounded-md text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Order #{order.orderNumber}</span>
                                                        <Badge variant={
                                                            order.status === "DELIVERED" ? "success" :
                                                                order.status === "PROCESSING" ? "warning" :
                                                                    order.status === "SHIPPED" ? "default" : "destructive"
                                                        }>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-gray-500 text-xs mt-1">
                                                        {format(new Date(order.createdAt), "MMM d, yyyy")} - ${order.total.toFixed(2)}
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-sm text-gray-500">No order history yet</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" asChild className="w-full">
                                <Link href={`/admin/customers/${customer.id}#orders`}>
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    View All Orders
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right columns - Main content area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="orders">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="orders">Orders</TabsTrigger>
                            <TabsTrigger value="addresses">Addresses</TabsTrigger>
                            <TabsTrigger value="notes">Customer Notes</TabsTrigger>
                        </TabsList>

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order History</CardTitle>
                                    <CardDescription>View all customer orders and their statuses</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {customer.orders.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Order #</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Items</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customer.orders.map((order) => (
                                                    <TableRow key={order.id} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <Link
                                                                href={`/admin/orders/${order.id}`}
                                                                className="font-medium hover:underline"
                                                            >
                                                                #{order.orderNumber}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                order.status === "DELIVERED" ? "success" :
                                                                    order.status === "PROCESSING" ? "warning" :
                                                                        order.status === "SHIPPED" ? "default" : "destructive"
                                                            }>
                                                                {order.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center">
                                                                <Package className="h-4 w-4 text-gray-400 mr-1.5" />
                                                                <span>{order.items}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${order.total.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8">
                                            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                                            <p className="text-gray-500 mt-1">This customer hasn't placed any orders</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Addresses Tab */}
                        <TabsContent value="addresses" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Saved Addresses</CardTitle>
                                    <CardDescription>Customer shipping and billing addresses</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {customer.addresses.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {customer.addresses.map((address) => (
                                                <div key={address.id} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="font-medium">{address.name}</span>
                                                            {address.isDefault && (
                                                                <Badge className="ml-2" variant="outline">Default</Badge>
                                                            )}
                                                        </div>
                                                        <Badge>{address.type}</Badge>
                                                    </div>
                                                    <div className="text-sm text-gray-500 space-y-1">
                                                        <p>{address.line1}</p>
                                                        {address.line2 && <p>{address.line2}</p>}
                                                        <p>{address.city}, {address.state} {address.postalCode}</p>
                                                        <p>{address.country}</p>
                                                        {address.phone && <p>Phone: {address.phone}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900">No addresses saved</h3>
                                            <p className="text-gray-500 mt-1">This customer hasn't added any addresses</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" asChild className="w-full">
                                        <Link href={`/admin/customers/${customerId}/addresses`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Manage Addresses
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Customer Notes</CardTitle>
                                    <CardDescription>Internal notes about this customer</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">No notes yet</h3>
                                        <p className="text-gray-500 mt-1">Add notes to keep track of customer interactions</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Add Note
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be undone
                            and all associated data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm mb-4">
                        <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                        This will delete all customer data including orders, addresses, and preferences.
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteCustomer}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Customer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}