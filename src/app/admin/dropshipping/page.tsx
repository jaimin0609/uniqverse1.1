"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    RefreshCw,
    RotateCw,
    Truck,
    Package,
    Clock,
    Check,
    AlertCircle,
    ArrowUpRight
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
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

interface SupplierOrderSummary {
    id: string;
    orderNumber: string;
    supplierName: string;
    orderDate: string;
    status: string;
    totalCost: number;
    itemCount: number;
    trackingNumber: string | null;
}

interface DropshippingStats {
    totalSupplierOrders: number;
    pendingSupplierOrders: number;
    processingSupplierOrders: number;
    shippedSupplierOrders: number;
    completedSupplierOrders: number;
    cancelledSupplierOrders: number;
    activeSuppliers: number;
    totalOrderValue: number;
}

export default function DropshippingDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [recentOrders, setRecentOrders] = useState<SupplierOrderSummary[]>([]);
    const [stats, setStats] = useState<DropshippingStats>({
        totalSupplierOrders: 0,
        pendingSupplierOrders: 0,
        processingSupplierOrders: 0,
        shippedSupplierOrders: 0,
        completedSupplierOrders: 0,
        cancelledSupplierOrders: 0,
        activeSuppliers: 0,
        totalOrderValue: 0
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/dropshipping/dashboard");
            if (!response.ok) {
                throw new Error("Failed to fetch dropshipping data");
            }
            const data = await response.json();
            setRecentOrders(data.recentOrders || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error("Error fetching dropshipping dashboard data:", error);
            toast.error("Failed to load dropshipping data");
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
                fetchDashboardData(); // Refresh dashboard data after update
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

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title="Dropshipping Dashboard"
                description="Monitor and manage your dropshipping operations"
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

            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <RotateCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalSupplierOrders}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">In Processing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.processingSupplierOrders}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.pendingSupplierOrders} pending
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Shipped</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.shippedSupplierOrders}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.completedSupplierOrders}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Status Summary</CardTitle>
                                <CardDescription>Current status of all supplier orders</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-yellow-400 h-2.5 rounded-full" style={{
                                                width: `${stats.totalSupplierOrders ? (stats.pendingSupplierOrders / stats.totalSupplierOrders * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <span className="ml-4 min-w-[40px] text-right">{stats.pendingSupplierOrders}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-500 h-2.5 rounded-full" style={{
                                                width: `${stats.totalSupplierOrders ? (stats.processingSupplierOrders / stats.totalSupplierOrders * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <span className="ml-4 min-w-[40px] text-right">{stats.processingSupplierOrders}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-indigo-500 h-2.5 rounded-full" style={{
                                                width: `${stats.totalSupplierOrders ? (stats.shippedSupplierOrders / stats.totalSupplierOrders * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <span className="ml-4 min-w-[40px] text-right">{stats.shippedSupplierOrders}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{
                                                width: `${stats.totalSupplierOrders ? (stats.completedSupplierOrders / stats.totalSupplierOrders * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <span className="ml-4 min-w-[40px] text-right">{stats.completedSupplierOrders}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-red-500 h-2.5 rounded-full" style={{
                                                width: `${stats.totalSupplierOrders ? (stats.cancelledSupplierOrders / stats.totalSupplierOrders * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <span className="ml-4 min-w-[40px] text-right">{stats.cancelledSupplierOrders}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 mt-4">
                                    <div>Pending</div>
                                    <div>Processing</div>
                                    <div>Shipped</div>
                                    <div>Completed</div>
                                    <div>Cancelled</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Dropshipping Performance</CardTitle>
                                <CardDescription>Key metrics for your dropshipping operation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Truck className="h-5 w-5 mr-2 text-indigo-500" />
                                            <span>Active Suppliers</span>
                                        </div>
                                        <div className="font-bold">{stats.activeSuppliers}</div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Package className="h-5 w-5 mr-2 text-indigo-500" />
                                            <span>Total Order Value</span>
                                        </div>
                                        <div className="font-bold">${stats.totalOrderValue.toFixed(2)}</div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Check className="h-5 w-5 mr-2 text-green-500" />
                                            <span>Fulfillment Rate</span>
                                        </div>
                                        <div className="font-bold">
                                            {stats.totalSupplierOrders ?
                                                (((stats.shippedSupplierOrders + stats.completedSupplierOrders) /
                                                    (stats.totalSupplierOrders - stats.cancelledSupplierOrders)) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Clock className="h-5 w-5 mr-2 text-amber-500" />
                                            <span>Avg. Processing Time</span>
                                        </div>
                                        <div className="font-bold">2.3 days</div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                                            <span>Cancellation Rate</span>
                                        </div>
                                        <div className="font-bold">
                                            {stats.totalSupplierOrders ?
                                                ((stats.cancelledSupplierOrders / stats.totalSupplierOrders) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Supplier Orders</CardTitle>
                                <CardDescription>Recently created and updated supplier orders</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => router.push('/admin/dropshipping/supplier-orders')}>
                                View All Orders
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                    No recent orders found
                                </div>
                            ) : (
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
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentOrders.map((order) => (
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
                                                        <span className="text-xs truncate">
                                                            {order.trackingNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin/dropshipping/supplier-orders/${order.id}`)}
                                                    >
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}