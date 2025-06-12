"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart,
    Eye,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Download,
    AlertTriangle
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { format } from "date-fns";

interface VendorOrder {
    id: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string;
        email: string;
    };
    status: string;
    paymentStatus: string;
    vendorTotal: number;
    vendorItems: {
        id: string;
        quantity: number;
        price: number;
        total: number;
        product: {
            id: string;
            name: string;
            images: { url: string }[];
        };
    }[];
    createdAt: string;
    shippingAddress: any;
}

export default function VendorOrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    // Stats for dashboard
    const [orderStats, setOrderStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
    });

    // Redirect if not vendor
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }
    }, [session, status, router]);

    // Fetch orders
    useEffect(() => {
        if (session?.user?.role === "VENDOR") {
            fetchOrders();
        }
    }, [session, currentPage, searchTerm, statusFilter, paymentFilter]);

    const fetchOrders = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                search: searchTerm,
                status: statusFilter,
                paymentStatus: paymentFilter
            });

            const response = await fetch(`/api/vendor/orders?${params}`);
            if (!response.ok) {
                throw new Error("Failed to fetch orders");
            }
            const data = await response.json();

            setOrders(data.orders || []);
            setOrderStats(data.stats || orderStats);
            setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case "PROCESSING":
                return <Badge variant="default"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
            case "SHIPPED":
                return <Badge variant="outline">Shipped</Badge>;
            case "DELIVERED":
                return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
            case "COMPLETED":
                return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case "CANCELLED":
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge variant="success">Paid</Badge>;
            case "PENDING":
                return <Badge variant="warning">Pending</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>;
            case "REFUNDED":
                return <Badge variant="outline">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session?.user || session.user.role !== "VENDOR") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-600 mt-1">
                                Track and manage orders containing your products
                            </p>
                        </div>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export Orders
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{orderStats.total}</div>
                            <p className="text-xs text-gray-600">Total Orders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{orderStats.pending}</div>
                            <p className="text-xs text-gray-600">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
                            <p className="text-xs text-gray-600">Processing</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                            <p className="text-xs text-gray-600">Completed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                            <p className="text-xs text-gray-600">Cancelled</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-600">${orderStats.totalRevenue.toFixed(0)}</div>
                            <p className="text-xs text-gray-600">Total Revenue</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search orders..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Filter by payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payments</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orders ({orders.length})</CardTitle>
                        <CardDescription>
                            Orders containing your products
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Your Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <Link
                                                href={`/vendor/orders/${order.id}`}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                #{order.orderNumber}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{order.customer.name}</div>
                                                <div className="text-sm text-gray-500">{order.customer.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {order.vendorItems.slice(0, 3).map((item, index) => (
                                                        <div key={index} className="h-8 w-8 rounded border-2 border-white overflow-hidden">
                                                            {item.product.images?.[0]?.url ? (
                                                                <img
                                                                    src={item.product.images[0].url}
                                                                    alt={item.product.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                                    <Package className="h-3 w-3 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {order.vendorItems.length} item{order.vendorItems.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ${order.vendorTotal.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell>
                                            {getPaymentBadge(order.paymentStatus)}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/vendor/orders/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingCart className="h-12 w-12 text-gray-400" />
                                                <p className="text-gray-500">No orders found</p>
                                                <p className="text-sm text-gray-400">Orders will appear here when customers purchase your products</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="px-4 py-2 text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
