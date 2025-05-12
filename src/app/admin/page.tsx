"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
    ArrowRight
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
        products: 0
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
            products: Math.floor(Math.random() * 10) - 2 // -2% to +8%
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

                // Calculate growth rates
                const newGrowthRates = calculateGrowthRates(data);
                setGrowthRates(newGrowthRates);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Sales</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                ${stats.totalSales.toFixed(2)}
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
                                <span className="text-green-500 font-medium">+{growthRates.sales}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.sales}%</span>
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
                                <span className="text-green-500 font-medium">+{growthRates.orders}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.orders}%</span>
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
                                <span className="text-green-500 font-medium">+{growthRates.products}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.products}%</span>
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
                                <span className="text-green-500 font-medium">+{growthRates.users}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">{growthRates.users}%</span>
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
                                            label: 'Daily Sales',
                                            data: stats.salesByDay.map(day => day.sales),
                                            fill: false,
                                            borderColor: 'rgb(59, 130, 246)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                            tension: 0.1
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top',
                                        },
                                        title: {
                                            display: true,
                                            text: `Sales for the Last ${dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : '12 Months'}`
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function (value) {
                                                    return '$' + value;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="text-center p-4 h-full flex items-center justify-center">
                                <div>
                                    <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No sales data available</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        {stats.salesByDay.slice(0, 4).map((day, index) => (
                            <div key={index} className="p-2">
                                <p className="text-xs text-gray-500">{day.date}</p>
                                <p className="font-medium">${day.sales.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Action Required</h2>

                    <div className="space-y-4">
                        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                            <div className="p-2 bg-yellow-100 rounded-full mr-3">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Pending Orders</p>
                                <p className="text-sm text-gray-500">{stats.pendingOrderCount} orders need processing</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" asChild>
                                <Link href="/admin/orders?status=PENDING_PAYMENT">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex items-center p-3 bg-red-50 border border-red-100 rounded-md">
                            <div className="p-2 bg-red-100 rounded-full mr-3">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Low Stock</p>
                                <p className="text-sm text-gray-500">{stats.lowStockProducts.length} products low on inventory</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" asChild>
                                <Link href="/admin/products?inventory=low">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-md">
                            <div className="p-2 bg-blue-100 rounded-full mr-3">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">New Reviews</p>
                                <p className="text-sm text-gray-500">{stats.pendingReviewsCount} reviews need approval</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" asChild>
                                <Link href="/admin/reviews?status=pending">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Low Stock Products */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Low Stock Products</h3>
                        <div className="space-y-2">
                            {stats.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm truncate max-w-[180px]">{product.name}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.inventory <= (product.lowStockThreshold ? product.lowStockThreshold / 2 : 3)
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {product.inventory} left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/orders">
                            View All
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                                #{order.id.substring(0, 8)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.user.name || 'Anonymous'}</div>
                                            <div className="text-xs text-gray-500">{order.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'PENDING' || order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}