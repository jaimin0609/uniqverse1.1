"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Eye,
    Users,
    Star,
    Plus,
    BarChart3,
    Calendar,
    AlertCircle,
    CheckCircle,
    Loader2
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
import { format } from "date-fns";
import { formatPrice, type Currency } from "@/lib/currency-utils";
// Removed heavy imports - will load them lazily
// import VendorCommissionDashboard from "@/components/vendor/VendorCommissionDashboard";
// import VendorNotifications from "@/components/vendor/VendorNotifications";

interface VendorStats {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    monthlyGrowth: number;
    productViews: number;
    conversionRate: number;
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
    items: number;
}

interface VendorProduct {
    id: string;
    name: string;
    price: number;
    inventory: number;
    orders: number;
    revenue: number;
    status: string;
}

export default function VendorDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<VendorStats>({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        monthlyGrowth: 0,
        productViews: 0,
        conversionRate: 0
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [topProducts, setTopProducts] = useState<VendorProduct[]>([]);
    const [isLoadingMain, setIsLoadingMain] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [currency] = useState<Currency>("USD");

    // Redirect if not vendor
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }
    }, [session, status, router]);

    // Fetch essential dashboard data first (fast)
    useEffect(() => {
        if (session?.user?.role === "VENDOR") {
            fetchQuickDashboardData();
        }
    }, [session]);

    // Fetch heavy data separately (slower, non-blocking)
    useEffect(() => {
        if (session?.user?.role === "VENDOR") {
            fetchTopProducts();
        }
    }, [session]);

    const fetchQuickDashboardData = async () => {
        try {
            const response = await fetch(`/api/vendor/dashboard/quick?currency=${currency}`);
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }
            const data = await response.json();

            setStats(data.stats);
            setRecentOrders(data.recentOrders || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoadingMain(false);
        }
    };

    const fetchTopProducts = async () => {
        try {
            const response = await fetch(`/api/vendor/dashboard/products?currency=${currency}`);
            if (!response.ok) {
                throw new Error("Failed to fetch products data");
            }
            const data = await response.json();

            setTopProducts(data.topProducts || []);
        } catch (error) {
            console.error("Error fetching products data:", error);
            // Don't show error for secondary data
        } finally {
            setIsLoadingProducts(false);
        }
    };

    if (status === "loading" || isLoadingMain) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session?.user || session.user.role !== "VENDOR") {
        return null;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="warning">Pending</Badge>;
            case "PROCESSING":
                return <Badge variant="default">Processing</Badge>;
            case "SHIPPED":
                return <Badge variant="outline">Shipped</Badge>;
            case "DELIVERED":
                return <Badge variant="success">Delivered</Badge>;
            case "CANCELLED":
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Welcome back, {session.user.name}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button asChild>
                                <Link href="/vendor/products/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/vendor/analytics">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Analytics
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue || 0, currency)}</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">                                <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                                <p className="text-2xl font-bold">{(stats.monthlyGrowth || 0).toFixed(1)}%</p>
                            </div>
                                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="text-xl font-semibold">{stats.pendingOrders}</p>
                            </div>
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">                            <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Product Views</p>
                            <p className="text-xl font-semibold">{(stats.productViews || 0).toLocaleString()}</p>
                        </div>
                        <Eye className="h-5 w-5 text-blue-500" />
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">                            <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                            <p className="text-xl font-semibold">{(stats.conversionRate || 0).toFixed(1)}%</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders and Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Recent Orders</CardTitle>
                                <CardDescription>Your latest customer orders</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/vendor/orders">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/vendor/orders/${order.id}`}
                                                    className="font-medium text-blue-600 hover:underline"
                                                >
                                                    #{order.orderNumber}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{order.customerName}</TableCell>
                                            <TableCell>{formatPrice(order.total || 0, currency)}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No recent orders
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Top Products</CardTitle>
                                <CardDescription>Your best performing products</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/vendor/products">Manage Products</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingProducts ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Loading products...
                            </div>
                        ) : topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.slice(0, 5).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatPrice(product.price, currency)} • {product.orders} orders
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatPrice(product.revenue, currency)}</p>
                                            <p className="text-sm text-gray-600">{product.inventory} in stock</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No products found
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex-col" asChild>
                            <Link href="/vendor/products/new">
                                <Plus className="h-6 w-6 mb-2" />
                                Add Product
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" asChild>
                            <Link href="/vendor/orders">
                                <ShoppingCart className="h-6 w-6 mb-2" />
                                View Orders
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" asChild>
                            <Link href="/vendor/analytics">
                                <BarChart3 className="h-6 w-6 mb-2" />
                                Analytics
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" asChild>
                            <Link href="/vendor/settings">
                                <Users className="h-6 w-6 mb-2" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
