"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Package,
    ShoppingCart,
    Eye,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { format, subDays } from "date-fns";

interface AnalyticsData {
    overview: {
        totalRevenue: number;
        revenueChange: number;
        totalOrders: number;
        ordersChange: number;
        totalProducts: number;
        averageOrderValue: number;
        conversionRate: number;
        productViews: number;
    };
    salesData: Array<{
        date: string;
        sales: number;
        orders: number;
    }>;
    topProducts: Array<{
        id: string;
        name: string;
        revenue: number;
        orders: number;
        views: number;
        conversionRate: number;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        description: string;
        date: string;
        amount?: number;
    }>;
}

export default function VendorAnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30");

    // Redirect if not vendor
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }
    }, [session, status, router]);

    // Fetch analytics data
    useEffect(() => {
        if (session?.user?.role === "VENDOR") {
            fetchAnalytics();
        }
    }, [session, dateRange]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`/api/vendor/analytics?days=${dateRange}`);
            if (!response.ok) {
                throw new Error("Failed to fetch analytics");
            }
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setIsLoading(false);
        }
    };

    const exportData = async () => {
        try {
            const response = await fetch(`/api/vendor/analytics/export?days=${dateRange}`);
            if (!response.ok) {
                throw new Error("Failed to export data");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `vendor-analytics-${dateRange}days.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("Analytics data exported successfully");
        } catch (error) {
            console.error("Error exporting data:", error);
            toast.error("Failed to export data");
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

    if (!analytics) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">No Analytics Data</h2>
                    <p className="text-gray-600">Unable to load analytics data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Insights into your business performance
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                    <SelectItem value="365">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={exportData}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</p>
                                    <div className="flex items-center mt-1">
                                        {analytics.overview.revenueChange >= 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={`text-sm ml-1 ${analytics.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {Math.abs(analytics.overview.revenueChange).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold">{analytics.overview.totalOrders}</p>
                                    <div className="flex items-center mt-1">
                                        {analytics.overview.ordersChange >= 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={`text-sm ml-1 ${analytics.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {Math.abs(analytics.overview.ordersChange).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                                    <p className="text-2xl font-bold">${analytics.overview.averageOrderValue.toFixed(2)}</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                                    <p className="text-2xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</p>
                                </div>
                                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Sales Chart Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Over Time</CardTitle>
                            <CardDescription>
                                Daily sales performance for the last {dateRange} days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Sales chart would be rendered here</p>
                                    <p className="text-sm text-gray-400">Integration with charting library needed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Products</CardTitle>
                            <CardDescription>
                                Your best selling products by revenue
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.topProducts.slice(0, 5).map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${product.revenue.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.orders}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest orders and product activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                {activity.type === "order" ? (
                                                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                                                ) : (
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{activity.description}</p>
                                                <p className="text-sm text-gray-600">
                                                    {format(new Date(activity.date), "MMM dd, yyyy 'at' h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        {activity.amount && (
                                            <Badge variant="default">
                                                ${activity.amount.toFixed(2)}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No recent activity
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
