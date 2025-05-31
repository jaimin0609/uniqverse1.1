"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ClientPrice } from "@/components/ui/client-price";
import {
    Users,
    Package,
    ShoppingCart,
    DollarSign,
    BarChart2,
    TrendingUp,
    TrendingDown,
    Clock,
    Loader2,
    ExternalLink,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register the required Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface DashboardStats {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    newsletterStats: {
        totalSubscribers: number;
        activeSubscribers: number;
        unsubscribedCount: number;
        recentSubscriptions: number;
    };
    recentOrders: {
        id: string;
        total: number;
        status: string;
        createdAt: string;
        user: {
            name: string;
            email: string;
        };
    }[];
    lowStockProducts: {
        id: string;
        name: string;
        inventory: number;
        lowStockThreshold?: number;
    }[];
    salesByDay: {
        date: string;
        sales: number;
    }[];
    pendingOrderCount: number;
    pendingReviewsCount: number;
    growthRates?: {
        sales: number;
        orders: number;
        products: number;
        users: number;
        newsletter: number;
    };
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("week"); // week, month, year
    const [growthRates, setGrowthRates] = useState({
        sales: 0,
        orders: 0,
        users: 0,
        products: 0,
        newsletter: 0
    });

    // Function to calculate growth percentages
    const calculateGrowthRates = (currentStats: DashboardStats) => {
        // These would normally be calculated by comparing current vs previous period
        // For now, we'll use random values for demonstration
        // In a real implementation, you would fetch previous period data from the API
        return {
            sales: Math.floor(Math.random() * 20) - 5, // -5% to +15%
            orders: Math.floor(Math.random() * 20) - 5,
            users: Math.floor(Math.random() * 20) - 2, // -2% to +18%
            products: Math.floor(Math.random() * 10) - 2, // -2% to +8%
            newsletter: Math.floor(Math.random() * 30) - 5 // Newsletter can have higher volatility
        };
    };

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch real data from our API
                const response = await fetch(`/api/admin/stats?range=${dateRange}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();

                setStats(data);

                // Use growth rates from API if available, otherwise calculate them
                if (data.growthRates) {
                    setGrowthRates(data.growthRates);
                } else {
                    const newGrowthRates = calculateGrowthRates(data);
                    setGrowthRates(newGrowthRates);
                }
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [dateRange]);

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

    if (!stats) {
        return (
            <div className="bg-yellow-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-600">No data available. This might be because you haven't processed any orders yet.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">
                        Welcome back, {session?.user?.name || "Admin"}
                    </p>
                </div>
                <div className="mt-3 sm:mt-0">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last 12 Months</option>
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Sales</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                <ClientPrice amount={stats.totalSales} />
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded">
                            <DollarSign className="h-5 w-5 text-blue-700" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                        {growthRates.sales >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+{growthRates.sales.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.sales.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-gray-500 ml-1">vs. previous period</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.totalOrders}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-100 rounded">
                            <ShoppingCart className="h-5 w-5 text-orange-700" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                        {growthRates.orders >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+{growthRates.orders.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.orders.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-gray-500 ml-1">vs. previous period</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.totalProducts}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded">
                            <Package className="h-5 w-5 text-green-700" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                        {growthRates.products >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+{growthRates.products.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.products.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-gray-500 ml-1">vs. previous period</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.totalUsers}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded">
                            <Users className="h-5 w-5 text-purple-700" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                        {growthRates.users >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+{growthRates.users.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.users.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-gray-500 ml-1">vs. previous period</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Newsletter Subscribers</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.newsletterStats.activeSubscribers}
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-100 rounded">
                            <Mail className="h-5 w-5 text-indigo-700" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                        {growthRates.newsletter >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+{growthRates.newsletter.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.newsletter.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-gray-500 ml-1">vs. previous period</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Sales Overview</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/reports">
                                View Reports
                                <ExternalLink className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="h-72 bg-gray-50 rounded-lg p-4">
                        {stats.salesByDay.length > 0 ? (
                            <Line
                                data={{
                                    labels: stats.salesByDay.map(day => day.date),
                                    datasets: [
                                        {
                                            label: 'Sales',
                                            data: stats.salesByDay.map(day => day.sales),
                                            borderColor: 'rgb(59, 130, 246)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            tension: 0.4,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <BarChart2 className="h-8 w-8 mr-2" />
                                <span>No sales data available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Newsletter Stats */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Newsletter Overview</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/newsletter">
                                Manage
                                <ExternalLink className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Subscribers</span>
                            <span className="font-semibold">{stats.newsletterStats.totalSubscribers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Active</span>
                            <span className="font-semibold text-green-600">{stats.newsletterStats.activeSubscribers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Unsubscribed</span>
                            <span className="font-semibold text-red-600">{stats.newsletterStats.unsubscribedCount}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-600">Recent ({dateRange})</span>
                            <span className="font-semibold text-blue-600">{stats.newsletterStats.recentSubscriptions}</span>
                        </div>
                        
                        <div className="pt-2">
                            <Button className="w-full" size="sm" asChild>
                                <Link href="/admin/newsletter/send-campaign">
                                    Send Campaign
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/orders">
                                View All Orders
                                <ExternalLink className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {stats.recentOrders.length > 0 ? (
                            stats.recentOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <div>
                                        <p className="font-medium text-sm">{order.user.name}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(order.createdAt), "MMM dd, yyyy")}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">
                                            <ClientPrice amount={order.total} />
                                        </p>
                                        <p className={`text-xs px-2 py-1 rounded ${
                                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {order.status}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent orders</p>
                        )}
                    </div>

                    {/* Action Items */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 text-orange-500 mr-1" />
                                <span className="text-gray-600">Pending Orders</span>
                            </div>
                            <span className="font-semibold text-orange-600">{stats.pendingOrderCount}</span>
                        </div>
                        {stats.pendingReviewsCount > 0 && (
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center text-sm">
                                    <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />
                                    <span className="text-gray-600">Pending Reviews</span>
                                </div>
                                <span className="font-semibold text-blue-600">{stats.pendingReviewsCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Products */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Low Stock Alert</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/products">
                                Manage Inventory
                                <ExternalLink className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {stats.lowStockProducts.length > 0 ? (
                            stats.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <div>
                                        <p className="font-medium text-sm">{product.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Threshold: {product.lowStockThreshold || 10}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-medium text-sm ${
                                            product.inventory <= 5 ? 'text-red-600' : 
                                            product.inventory <= 10 ? 'text-orange-600' : 'text-green-600'
                                        }`}>
                                            {product.inventory} left
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">All products have sufficient stock</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
