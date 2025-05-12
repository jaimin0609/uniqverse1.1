"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    RefreshCw,
    RotateCw,
    Search,
    Filter,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Send,
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

interface SupplierOrder {
    id: string;
    orderNumber: string;
    supplierName: string;
    orderDate: string;
    status: string;
    totalCost: number;
    shippingCost: number;
    itemCount: number;
    trackingNumber: string | null;
    trackingUrl: string | null;
    carrier: string | null;
    externalOrderId: string | null;
    estimatedDelivery: string | null;
    notes: string | null;
}

export default function SupplierOrdersPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<SupplierOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);
    const ordersPerPage = 10;

    useEffect(() => {
        fetchSuppliers();
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, searchTerm, statusFilter, supplierFilter]);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("/api/admin/suppliers");
            if (!response.ok) {
                throw new Error("Failed to fetch suppliers");
            }
            const data = await response.json();
            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        }
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/supplier-orders");
            if (!response.ok) {
                throw new Error("Failed to fetch supplier orders");
            }
            const data = await response.json();
            setOrders(data.orders || []);
            setFilteredOrders(data.orders || []);
            setTotalPages(Math.ceil((data.orders?.length || 0) / ordersPerPage));
        } catch (error) {
            console.error("Error fetching supplier orders:", error);
            toast.error("Failed to load supplier orders");
        } finally {
            setIsLoading(false);
        }
    };

    const refreshOrderUpdates = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch("/api/admin/supplier-orders/check-updates", {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to refresh order updates");
            }

            const result = await response.json();

            if (result.success) {
                toast.success(`Updated ${result.updatedOrders} orders from suppliers`);
                fetchOrders(); // Refresh orders data after update
            } else {
                toast.error(`Failed to update orders: ${result.error}`);
            }
        } catch (error) {
            console.error("Error refreshing order updates:", error);
            toast.error("Failed to check for order updates");
        } finally {
            setIsRefreshing(false);
        }
    };

    const sendOrderToSupplier = async (orderId: string) => {
        try {
            const response = await fetch(`/api/admin/supplier-orders/${orderId}/send`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to send order to supplier");
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Order successfully sent to supplier");
                fetchOrders(); // Refresh orders after sending
            } else {
                toast.error(`Failed to send order: ${result.error}`);
            }
        } catch (error) {
            console.error("Error sending order to supplier:", error);
            toast.error("Failed to send order to supplier");
        }
    };

    const applyFilters = () => {
        let filtered = orders;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.externalOrderId && order.externalOrderId.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Apply supplier filter
        if (supplierFilter !== "all") {
            filtered = filtered.filter(order => order.supplierName === supplierFilter);
        }

        setFilteredOrders(filtered);
        setTotalPages(Math.ceil(filtered.length / ordersPerPage));
        // Reset to first page when filters change
        if (page > 1) {
            setPage(1);
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

    const paginatedOrders = filteredOrders.slice(
        (page - 1) * ordersPerPage,
        page * ordersPerPage
    );

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title="Supplier Orders"
                description="Manage and monitor orders sent to dropshipping suppliers"
                actions={
                    <Button
                        onClick={refreshOrderUpdates}
                        disabled={isRefreshing}
                        size="sm"
                    >
                        {isRefreshing ? (
                            <>
                                <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Checking...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" /> Check for Updates
                            </>
                        )}
                    </Button>
                }
            />

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filter Orders</CardTitle>
                    <CardDescription>Find specific supplier orders</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by order number, supplier, tracking..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="SHIPPED">Shipped</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={supplierFilter}
                            onValueChange={setSupplierFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers.map(supplier => (
                                    <SelectItem key={supplier.id} value={supplier.name}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setSupplierFilter("all");
                        }} className="whitespace-nowrap">
                            <Filter className="mr-2 h-4 w-4" /> Reset Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Supplier Orders</CardTitle>
                            <CardDescription>
                                {filteredOrders.length} orders found
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/admin/dropshipping')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <RotateCw className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No supplier orders found matching your filters
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Tracking</TableHead>
                                            <TableHead>External ID</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    {order.orderNumber}
                                                </TableCell>
                                                <TableCell>{order.supplierName}</TableCell>
                                                <TableCell>
                                                    {new Date(order.orderDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(order.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {order.itemCount}
                                                </TableCell>
                                                <TableCell>
                                                    ${order.totalCost.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {order.trackingNumber ? (
                                                        order.trackingUrl ? (
                                                            <a
                                                                href={order.trackingUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-500 underline truncate block max-w-[100px]"
                                                            >
                                                                {order.trackingNumber}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs truncate block max-w-[100px]">
                                                                {order.trackingNumber}
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {order.externalOrderId ? (
                                                        <span className="text-xs truncate block max-w-[100px]">
                                                            {order.externalOrderId}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        {order.status === "PENDING" && !order.externalOrderId && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => sendOrderToSupplier(order.id)}
                                                                title="Send to supplier"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => router.push(`/admin/dropshipping/supplier-orders/${order.id}`)}
                                                            title="View details"
                                                        >
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((page - 1) * ordersPerPage) + 1} to {Math.min(page * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="text-sm">
                                            Page {page} of {totalPages}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}