"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClientPrice } from "@/components/ui/client-price";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
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
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface SalesData {
    salesByDay: {
        date: string;
        sales: number;
    }[];
    salesByCategory: {
        category: string;
        sales: number;
    }[];
    salesByProduct: {
        product: string;
        sales: number;
    }[];
    salesByRegion: {
        region: string;
        sales: number;
    }[];
    totalSales: number;
    averageOrderValue: number;
    conversionRate: number;
}

export default function AdminReportsPage() {
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("week"); // week, month, year

    useEffect(() => {
        const fetchSalesData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch real data from our API
                const response = await fetch(`/api/admin/stats?range=${dateRange}&detailed=true`);

                if (!response.ok) {
                    throw new Error('Failed to fetch sales reports data');
                }

                const data = await response.json();

                // Ensure the data has all required properties or set defaults
                const enhancedData = {
                    ...data,
                    salesByDay: data.salesByDay || [],
                    salesByCategory: data.salesByCategory || [],
                    salesByProduct: data.salesByProduct || [],
                    salesByRegion: data.salesByRegion || [],
                    totalSales: data.totalSales || 0,
                    averageOrderValue: data.averageOrderValue || 0,
                    conversionRate: data.conversionRate || 0
                };

                setSalesData(enhancedData);
            } catch (err) {
                console.error("Error fetching sales data:", err);
                setError("Failed to load sales reports. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesData();
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

    if (!salesData) {
        return (
            <div className="bg-yellow-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-600">No data available. This might be because you haven't processed any orders yet.</p>
            </div>
        );
    }

    // Prepare line chart data for sales by day
    const salesByDayData = {
        labels: salesData.salesByDay.length > 0
            ? salesData.salesByDay.map(item => item.date)
            : ['No data available'],
        datasets: [
            {
                label: 'Daily Sales',
                data: salesData.salesByDay.length > 0
                    ? salesData.salesByDay.map(item => item.sales)
                    : [0],
                fill: false,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.1
            }
        ]
    };

    // Prepare bar chart data for sales by category
    const salesByCategoryData = {
        labels: salesData.salesByCategory && salesData.salesByCategory.length > 0
            ? salesData.salesByCategory.map(item => item.category)
            : ['No category data'],
        datasets: [
            {
                label: 'Sales by Category',
                data: salesData.salesByCategory && salesData.salesByCategory.length > 0
                    ? salesData.salesByCategory.map(item => item.sales)
                    : [0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderWidth: 1
            }
        ]
    };

    // Prepare pie chart data for sales by region
    const salesByRegionData = {
        labels: salesData.salesByRegion && salesData.salesByRegion.length > 0
            ? salesData.salesByRegion.map(item => item.region)
            : ['No region data'],
        datasets: [
            {
                label: 'Sales by Region',
                data: salesData.salesByRegion && salesData.salesByRegion.length > 0
                    ? salesData.salesByRegion.map(item => item.sales)
                    : [0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Sales Performance',
            },
        },
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Button variant="outline" size="icon" asChild className="mr-2">
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                </div>
                <div className="flex items-center space-x-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="year">Last 12 Months</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
                    </CardHeader>                    <CardContent>
                        <div className="text-2xl font-bold"><ClientPrice amount={salesData.totalSales} /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Average Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><ClientPrice amount={salesData.averageOrderValue} /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesData.conversionRate.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="daily" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="daily">Daily Sales</TabsTrigger>
                    <TabsTrigger value="category">Sales by Category</TabsTrigger>
                    <TabsTrigger value="region">Sales by Region</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Sales</CardTitle>
                            <CardDescription>
                                View sales trend over the selected time period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <Line data={salesByDayData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="category" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                            <CardDescription>
                                Top performing product categories by sales
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <Bar data={salesByCategoryData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="region" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by Region</CardTitle>
                            <CardDescription>
                                Regional sales distribution
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <Pie data={salesByRegionData} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}