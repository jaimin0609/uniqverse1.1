"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Users,
    DollarSign,
    TrendingUp,
    Settings,
    AlertTriangle,
    CheckCircle,
    Ban,
    Crown,
    Star
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency-utils";

interface VendorPlan {
    id: string;
    name: string;
    email: string;
    planType: string;
    subscriptionStatus: string;
    monthlyFee: number;
    totalProducts: number;
    totalOrders: number;
    totalCommissions: number;
    performanceMetrics: {
        totalSales: number;
        averageRating: number;
        fulfillmentRate: number;
        returnRate: number;
    };
    createdAt: string;
    lastActive: string;
}

interface PlanStats {
    STARTER: { count: number; totalRevenue: number; avgCommission: number };
    PROFESSIONAL: { count: number; totalRevenue: number; avgCommission: number };
    ENTERPRISE: { count: number; totalRevenue: number; avgCommission: number };
}

export default function AdminVendorPlanDashboard() {
    const [vendors, setVendors] = useState<VendorPlan[]>([]);
    const [planStats, setPlanStats] = useState<PlanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVendor, setSelectedVendor] = useState<VendorPlan | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPlan, setFilterPlan] = useState('ALL');

    useEffect(() => {
        fetchVendorPlans();
    }, []);

    const fetchVendorPlans = async () => {
        try {
            const response = await fetch('/api/admin/vendor-plans');
            const data = await response.json();

            if (data.success) {
                setVendors(data.data.vendors);
                setPlanStats(data.data.planStats);
            } else {
                toast.error('Failed to load vendor plans');
            }
        } catch (error) {
            console.error('Error fetching vendor plans:', error);
            toast.error('Failed to load vendor plans');
        } finally {
            setLoading(false);
        }
    };

    const handleVendorAction = async (action: string, vendorId: string, planType?: string, reason?: string) => {
        setActionLoading(true);
        try {
            const response = await fetch('/api/admin/vendor-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    vendorId,
                    planType,
                    reason
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                await fetchVendorPlans(); // Refresh data
                setSelectedVendor(null);
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error performing action:', error);
            toast.error('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getPlanBadge = (planType: string) => {
        switch (planType) {
            case 'STARTER':
                return <Badge variant="secondary">Starter</Badge>;
            case 'PROFESSIONAL':
                return <Badge variant="default">Professional</Badge>;
            case 'ENTERPRISE':
                return <Badge variant="destructive">Enterprise</Badge>;
            default:
                return <Badge variant="outline">{planType}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success">Active</Badge>;
            case 'SUSPENDED':
                return <Badge variant="destructive">Suspended</Badge>;
            case 'CANCELLED':
                return <Badge variant="secondary">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPerformanceIcon = (metrics: any) => {
        const score = (metrics.averageRating / 5) * 100;
        if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
        if (score >= 60) return <Star className="h-4 w-4 text-yellow-600" />;
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    };

    const filteredVendors = vendors.filter(vendor => {
        const statusMatch = filterStatus === 'ALL' || vendor.subscriptionStatus === filterStatus;
        const planMatch = filterPlan === 'ALL' || vendor.planType === filterPlan;
        return statusMatch && planMatch;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Vendor Plan Management</h2>
                <Button onClick={fetchVendorPlans} variant="outline">
                    Refresh Data
                </Button>
            </div>

            {/* Plan Statistics */}
            {planStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Starter Plan</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{planStats.STARTER.count}</div>
                            <p className="text-xs text-muted-foreground">
                                Revenue: ${planStats.STARTER.totalRevenue.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Professional Plan</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{planStats.PROFESSIONAL.count}</div>
                            <p className="text-xs text-muted-foreground">
                                Revenue: ${planStats.PROFESSIONAL.totalRevenue.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enterprise Plan</CardTitle>
                            <Crown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{planStats.ENTERPRISE.count}</div>
                            <p className="text-xs text-muted-foreground">
                                Revenue: ${planStats.ENTERPRISE.totalRevenue.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Plans</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Vendor Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Vendor Plans ({filteredVendors.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Performance</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{vendor.name}</div>
                                            <div className="text-sm text-gray-500">{vendor.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPlanBadge(vendor.planType)}</TableCell>
                                    <TableCell>{getStatusBadge(vendor.subscriptionStatus)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getPerformanceIcon(vendor.performanceMetrics)}
                                            <span className="text-sm">
                                                {vendor.performanceMetrics.averageRating.toFixed(1)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{vendor.totalProducts}</TableCell>
                                    <TableCell>{vendor.totalOrders}</TableCell>
                                    <TableCell>${vendor.performanceMetrics.totalSales.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedVendor(vendor)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Manage Vendor: {vendor.name}</DialogTitle>
                                                </DialogHeader>
                                                <VendorActionDialog
                                                    vendor={vendor}
                                                    onAction={handleVendorAction}
                                                    loading={actionLoading}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function VendorActionDialog({ vendor, onAction, loading }: {
    vendor: VendorPlan;
    onAction: (action: string, vendorId: string, planType?: string, reason?: string) => void;
    loading: boolean;
}) {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!selectedAction) return;

        onAction(selectedAction, vendor.id, selectedPlan, reason);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Current Plan</Label>
                    <p className="text-sm text-gray-600">{vendor.planType}</p>
                </div>
                <div>
                    <Label>Status</Label>
                    <p className="text-sm text-gray-600">{vendor.subscriptionStatus}</p>
                </div>
            </div>

            <div>
                <Label htmlFor="action">Action</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CHANGE_PLAN">Change Plan</SelectItem>
                        <SelectItem value="SUSPEND_VENDOR">Suspend Vendor</SelectItem>
                        <SelectItem value="ACTIVATE_VENDOR">Activate Vendor</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedAction === 'CHANGE_PLAN' && (
                <div>
                    <Label htmlFor="plan">New Plan</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STARTER">Starter</SelectItem>
                            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this action..."
                />
            </div>

            <Button
                onClick={handleSubmit}
                disabled={loading || !selectedAction || (selectedAction === 'CHANGE_PLAN' && !selectedPlan)}
                className="w-full"
            >
                {loading ? 'Processing...' : 'Execute Action'}
            </Button>
        </div>
    );
}
