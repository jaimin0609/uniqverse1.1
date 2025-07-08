"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    TrendingUp,
    Users,
    ShoppingCart,
    Download,
    Eye,
    Calendar
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
import { format } from "date-fns";

interface AdminCommissionData {
    overview: {
        totalPlatformEarnings: number;
        totalVendorEarnings: number;
        totalTransactionFees: number;
        totalMonthlyFees: number;
        totalVendors: number;
        activeVendors: number;
        totalOrders: number;
        averageCommissionRate: number;
    };
    topVendors: Array<{
        id: string;
        name: string;
        totalSales: number;
        platformEarnings: number;
        vendorEarnings: number;
        orderCount: number;
        commissionRate: number;
    }>;
    dailyEarnings: Array<{
        date: string;
        platformEarnings: number;
        vendorEarnings: number;
        orderCount: number;
    }>;
    recentTransactions: Array<{
        id: string;
        vendorName: string;
        orderNumber: string;
        saleAmount: number;
        platformEarning: number;
        vendorEarning: number;
        date: string;
        status: string;
    }>;
}

export default function AdminCommissionDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<AdminCommissionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30");

    // Redirect if not admin
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "ADMIN") {
            router.push("/");
            return;
        }
    }, [session, status, router]);

    // Fetch commission data
    useEffect(() => {
        if (session?.user?.role === "ADMIN") {
            fetchCommissionData();
        }
    }, [session, dateRange]);

    const fetchCommissionData = async () => {
        try {
            const response = await fetch(`/api/admin/commissions?days=${dateRange}`);
            if (!response.ok) {
                throw new Error("Failed to fetch commission data");
            }
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error("Error fetching commission data:", error);
            toast.error("Failed to load commission data");
        } finally {
            setIsLoading(false);
        }
    };

    const exportData = async () => {
        try {
            const response = await fetch(`/api/admin/commissions/export?days=${dateRange}`);
            if (!response.ok) {
                throw new Error("Failed to export data");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `admin-commission-report-${dateRange}days.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("Commission report exported successfully");
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

    if (!session?.user || session.user.role !== "ADMIN") {
        return null;
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">No Commission Data</h2>
                    <p className="text-gray-600">Unable to load commission data</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">Commission Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Platform earnings and vendor commission overview
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
                                Export Report
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
                                    <p className="text-sm font-medium text-gray-600">Platform Earnings</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${data?.overview?.totalPlatformEarnings?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Commissions + Fees
                                    </p>
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
                                    <p className="text-sm font-medium text-gray-600">Vendor Earnings</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${data?.overview?.totalVendorEarnings?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paid to vendors
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                                    <p className="text-2xl font-bold">{data?.overview?.activeVendors || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        of {data?.overview?.totalVendors || 0} total
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold">{data?.overview?.totalOrders || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Avg: {data?.overview?.averageCommissionRate?.toFixed(1) || '0.0'}% commission
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Vendors Table */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Top Performing Vendors</CardTitle>
                        <CardDescription>
                            Vendors generating the most commission revenue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead className="text-right">Total Sales</TableHead>
                                    <TableHead className="text-right">Platform Earnings</TableHead>
                                    <TableHead className="text-right">Vendor Earnings</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Commission Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.topVendors?.map((vendor) => (
                                    <TableRow key={vendor.id}>
                                        <TableCell className="font-medium">
                                            {vendor.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${vendor.totalSales.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            ${vendor.platformEarnings.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            ${vendor.vendorEarnings.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {vendor.orderCount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(vendor.commissionRate * 100).toFixed(1)}%
                                        </TableCell>
                                    </TableRow>
                                )) || []}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Commission Transactions</CardTitle>
                        <CardDescription>
                            Latest commission transactions and earnings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead className="text-right">Sale Amount</TableHead>
                                    <TableHead className="text-right">Platform Earning</TableHead>
                                    <TableHead className="text-right">Vendor Earning</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.recentTransactions?.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">
                                            {transaction.orderNumber}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.vendorName}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${transaction.saleAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            ${transaction.platformEarning.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            ${transaction.vendorEarning.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(transaction.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={transaction.status === 'PAID' ? 'default' : 'secondary'}
                                                className={transaction.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                                            >
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )) || []}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
