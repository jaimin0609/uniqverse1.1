"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ShoppingBag,
    MoreHorizontal,
    Search,
    Calendar,
    Download,
    Filter,
    Loader2,
    AlertTriangle,
    ArrowUpDown,
    Eye,
    Edit,
    Truck,
    CreditCard,
    Package,
    Clock,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OrderData {
    id: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string | null;
        email: string;
    };
    status: string;
    paymentStatus: string;
    total: number;
    items: number;
    createdAt: string;
    updatedAt: string;
}

interface PaginationData {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const currentStatus = searchParams.get("status") || "all";
    const currentPaymentStatus = searchParams.get("paymentStatus") || "all";
    const currentCustomer = searchParams.get("customer") || "";
    const currentSort = searchParams.get("sort") || "date-desc";

    // Metrics for the dashboard
    const [metrics, setMetrics] = useState({
        totalOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        revenue: 0
    });

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch orders data
    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    status: currentStatus,
                    paymentStatus: currentPaymentStatus,
                    search: debouncedSearchTerm,
                    sort: currentSort
                });

                if (currentCustomer) {
                    params.append('customer', currentCustomer);
                }

                const response = await fetch(`/api/admin/orders?${params.toString()}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch orders");
                }

                const data = await response.json();
                setOrders(data.orders);
                setPagination(data.pagination);
                setMetrics(data.metrics || {
                    totalOrders: data.pagination.total,
                    processingOrders: data.orders.filter((o: OrderData) => o.status === "PROCESSING").length,
                    completedOrders: data.orders.filter((o: OrderData) => o.status === "DELIVERED").length,
                    revenue: data.orders.reduce((sum: number, order: OrderData) => sum + order.total, 0)
                });
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError("Failed to load orders. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage, currentStatus, currentPaymentStatus, currentCustomer, currentSort, debouncedSearchTerm]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > pagination.totalPages) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());

        router.push(`/admin/orders?${params.toString()}`);
    };

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", status);
        params.delete("page"); // Reset to first page when changing filters

        router.push(`/admin/orders?${params.toString()}`);
    };

    const handlePaymentStatusFilter = (paymentStatus: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("paymentStatus", paymentStatus);
        params.delete("page"); // Reset to first page when changing filters

        router.push(`/admin/orders?${params.toString()}`);
    };

    const handleSort = (sort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sort);

        router.push(`/admin/orders?${params.toString()}`);
    };

    // Export orders to CSV
    const exportOrders = () => {
        // Convert orders data to CSV format
        const headers = ["Order Number", "Customer", "Status", "Payment", "Items", "Total", "Date"];
        const csvData = orders.map(order => [
            order.orderNumber,
            order.customer.name || order.customer.email,
            order.status,
            order.paymentStatus,
            order.items.toString(),
            `$${order.total.toFixed(2)}`,
            format(new Date(order.createdAt), "yyyy-MM-dd")
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(","),
            ...csvData.map(row => row.join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `orders-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Orders data exported successfully");
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (isLoading && orders.length === 0) {
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

    return (
        <div>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Orders</h1>
                    <p className="text-gray-500 text-sm">
                        View and manage all customer orders
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportOrders}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Order Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Processing</p>
                            <p className="text-2xl font-bold">{metrics.processingOrders}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="text-2xl font-bold">{metrics.completedOrders}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <CreditCard className="h-6 w-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by order # or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="w-full sm:w-48">
                    <Select
                        defaultValue={currentStatus}
                        onValueChange={handleStatusFilter}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Order Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-48">
                    <Select
                        defaultValue={currentPaymentStatus}
                        onValueChange={handlePaymentStatusFilter}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Payment Status" />
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

                <div className="w-full sm:w-48">
                    <Select
                        defaultValue={currentSort}
                        onValueChange={handleSort}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Newest First</SelectItem>
                            <SelectItem value="date-asc">Oldest First</SelectItem>
                            <SelectItem value="total-desc">Highest Amount</SelectItem>
                            <SelectItem value="total-asc">Lowest Amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="font-medium text-blue-600 hover:underline"
                                        >
                                            #{order.orderNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/customers/${order.customer.id}`}
                                            className="hover:underline"
                                        >
                                            {order.customer.name || order.customer.email}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {format(new Date(order.createdAt), "h:mm a")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            order.status === "DELIVERED" ? "success" :
                                                order.status === "PROCESSING" ? "warning" :
                                                    order.status === "SHIPPED" ? "default" :
                                                        order.status === "CANCELLED" ? "destructive" :
                                                            "outline"
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            order.paymentStatus === "PAID" ? "success" :
                                                order.paymentStatus === "PENDING" ? "warning" :
                                                    order.paymentStatus === "FAILED" ? "destructive" :
                                                        order.paymentStatus === "REFUNDED" ? "outline" :
                                                            "default"
                                        }>
                                            {order.paymentStatus}
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
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border shadow-md">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/orders/${order.id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Order
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/customers/${order.customer.id}`}>
                                                        <ShoppingBag className="h-4 w-4 mr-2" />
                                                        Customer Profile
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    {currentCustomer ? (
                                        <div>
                                            <p className="text-gray-500 mb-2">No orders found for this customer</p>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href="/admin/orders">View all orders</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No orders found</p>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>

                    <span className="mx-2 text-sm text-gray-600">
                        Page {currentPage} of {pagination.totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                    >
                        Next
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={currentPage === pagination.totalPages}
                    >
                        Last
                    </Button>
                </div>
            )}
        </div>
    );
}