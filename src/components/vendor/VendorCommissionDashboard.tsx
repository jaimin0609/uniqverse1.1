import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    TrendingUp,
    TrendingDown,
    Star,
    Award,
    Target,
    DollarSign,
    Users,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import Link from "next/link";

interface VendorPlanInfo {
    planType?: string;
    planName?: string;
    monthlyFee?: number;
    commissionRate?: number;
    transactionFee?: number;
    subscriptionStatus?: string;
    nextBillingDate?: string;
}

interface PerformanceMetrics {
    totalSales?: number;
    orderCount?: number;
    averageRating?: number;
    reviewCount?: number;
    fulfillmentRate?: number;
    returnRate?: number;
    performanceScore?: number;
    monthlyGrowth?: number;
}

interface PlanRecommendation {
    recommended?: string;
    currentPlan?: string;
    reasoning?: string;
    potentialSavings?: number;
    shouldUpgrade?: boolean;
}

interface VendorCommissionDashboardProps {
    planInfo?: VendorPlanInfo | null;
    metrics?: PerformanceMetrics | null;
    recommendation?: PlanRecommendation | null;
    thisMonthCommissions?: number;
    projectedSavings?: number;
    className?: string;
}

export default function VendorCommissionDashboard({
    planInfo,
    metrics,
    recommendation,
    thisMonthCommissions = 0,
    projectedSavings = 0,
    className = ""
}: VendorCommissionDashboardProps) {
    // Ensure we have default values for all required data
    const safePlanInfo = {
        planType: 'STARTER',
        planName: 'Starter Plan',
        monthlyFee: 0,
        commissionRate: 0.08,
        transactionFee: 0.30,
        subscriptionStatus: 'ACTIVE',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ...(planInfo || {})
    };

    const safeMetrics = {
        totalSales: 0,
        orderCount: 0,
        averageRating: 0,
        reviewCount: 0,
        fulfillmentRate: 0,
        returnRate: 0,
        performanceScore: 0,
        monthlyGrowth: 0,
        ...(metrics || {})
    };

    // Ensure numeric values are actually numbers
    const safeThisMonthCommissions = Number(thisMonthCommissions) || 0;
    const safeProjectedSavings = Number(projectedSavings) || 0;
    const getPlanColor = (planType: string) => {
        switch (planType) {
            case 'STARTER':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'PROFESSIONAL':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'ENTERPRISE':
                return 'bg-purple-50 border-purple-200 text-purple-700';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success" className="ml-2">Active</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive" className="ml-2">Cancelled</Badge>;
            case 'SUSPENDED':
                return <Badge variant="secondary" className="ml-2">Suspended</Badge>;
            default:
                return <Badge variant="outline" className="ml-2">{status}</Badge>;
        }
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 85) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPerformanceIcon = (score: number) => {
        if (score >= 85) return <CheckCircle className="h-5 w-5 text-green-600" />;
        if (score >= 70) return <Target className="h-5 w-5 text-yellow-600" />;
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Commission Explanation */}
            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-blue-900">Understanding Your Earnings</h3>
                            <p className="text-sm text-blue-700">
                                The amounts shown below are your <strong>net earnings</strong> - what you receive after platform fees are deducted.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Current Plan Overview */}
            <Card className={`border-2 ${getPlanColor(safePlanInfo.planType)}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                            <Award className="h-5 w-5 mr-2" />
                            Current Plan: {safePlanInfo.planName}
                            {getStatusBadge(safePlanInfo.subscriptionStatus)}
                        </CardTitle>
                        <Button asChild variant="outline">
                            <Link href="/vendor/plans">
                                View All Plans
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Monthly Fee</p>
                            <p className="text-2xl font-bold">
                                ${(Number(safePlanInfo.monthlyFee) || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Commission Rate</p>
                            <p className="text-2xl font-bold">
                                {((Number(safePlanInfo.commissionRate) || 0) * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Transaction Fee</p>
                            <p className="text-2xl font-bold">
                                ${(Number(safePlanInfo.transactionFee) || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Next Billing</p>
                            <p className="text-sm font-medium">
                                {new Date(safePlanInfo.nextBillingDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Performance Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Performance Score</p>
                                {getPerformanceIcon(Number(safeMetrics.performanceScore) || 0)}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`text-2xl font-bold ${getPerformanceColor(Number(safeMetrics.performanceScore) || 0)}`}>
                                        {(Number(safeMetrics.performanceScore) || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <Progress value={Number(safeMetrics.performanceScore) || 0} className="h-2" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Monthly Sales</p>
                                <DollarSign className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    ${(Number(safeMetrics.totalSales) || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {Number(safeMetrics.orderCount) || 0} orders
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Average Rating</p>
                                <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {(Number(safeMetrics.averageRating) || 0).toFixed(1)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {Number(safeMetrics.reviewCount) || 0} reviews
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Fulfillment Rate</p>
                                <Users className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {((Number(safeMetrics.fulfillmentRate) || 0) * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-500">
                                    Return rate: {((Number(safeMetrics.returnRate) || 0) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Commission Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2" />
                            This Month's Earnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-3xl font-bold text-green-600">
                                ${safeThisMonthCommissions.toLocaleString()}
                            </div>
                            <div className="flex items-center space-x-2">
                                {(Number(safeMetrics.monthlyGrowth) || 0) > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm ${(Number(safeMetrics.monthlyGrowth) || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(Number(safeMetrics.monthlyGrowth) || 0) > 0 ? '+' : ''}{(Number(safeMetrics.monthlyGrowth) || 0).toFixed(1)}% from last month
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">
                                This is your take-home amount after platform fees
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Target className="h-5 w-5 mr-2" />
                            Projected Savings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-3xl font-bold text-blue-600">
                                ${safeProjectedSavings.toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-600">
                                Potential annual savings with current performance
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Recommendation */}
            {recommendation && recommendation.shouldUpgrade && (
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-yellow-800">
                            <Award className="h-5 w-5 mr-2" />
                            Plan Recommendation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-yellow-700 mb-2">Recommended Plan</p>
                                <p className="text-2xl font-bold text-yellow-800">
                                    {recommendation.recommended}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-yellow-700 mb-2">Potential Monthly Savings</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${(recommendation?.potentialSavings || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <Separator className="bg-yellow-200" />
                        <div className="space-y-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Why this recommendation:</strong> {recommendation.reasoning}
                            </p>
                            <div className="flex gap-3">
                                <Button asChild>
                                    <Link href="/vendor/plans">
                                        Upgrade Now
                                    </Link>
                                </Button>
                                <Button variant="outline">
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
