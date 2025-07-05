'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, TrendingUp, Users, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type Currency } from "@/lib/currency-utils";

interface VendorPlan {
    id: string;
    name: string;
    monthlyFee: number;
    transactionFee: number;
    commissionRate: number;
    benefits: string[];
    features: VendorPlanFeature[];
    maxProducts: number | null;
    prioritySupport: boolean;
    analyticsLevel: 'basic' | 'advanced' | 'premium';
    currency: string;
}

interface VendorPlanFeature {
    name: string;
    enabled: boolean;
    limit?: number;
}

interface VendorMetrics {
    totalSales: number;
    orderCount: number;
    averageRating: number;
    activeProducts: number;
}

interface PlanRecommendation {
    currentPlan: string;
    recommendedPlan: string;
    reasoning: string;
    potentialSavings: number;
}

interface VendorPlanSelectorProps {
    isVendor?: boolean;
    currentPlan?: string;
    className?: string;
}

export default function VendorPlanSelector({ isVendor = false, currentPlan, className = "" }: VendorPlanSelectorProps) {
    const [plans, setPlans] = useState<VendorPlan[]>([]);
    const [metrics, setMetrics] = useState<VendorMetrics | null>(null);
    const [recommendation, setRecommendation] = useState<PlanRecommendation | null>(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [currency, setCurrency] = useState<Currency>('USD');

    useEffect(() => {
        fetchPlans();
    }, [currency]);

    const fetchPlans = async () => {
        try {
            const response = await fetch(`/api/vendor/plans?currency=${currency}`);
            const data = await response.json();

            if (data.success) {
                setPlans(data.data.plans);
                if (data.data.metrics) setMetrics(data.data.metrics);
                if (data.data.recommendation) setRecommendation(data.data.recommendation);
                setCurrency(data.data.currency);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load vendor plans');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = async (planId: string) => {
        if (!isVendor) return;

        setSwitching(planId);
        try {
            const response = await fetch('/api/vendor/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planType: planId }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                await fetchPlans(); // Refresh data
            } else {
                toast.error(data.error || 'Failed to change plan');
            }
        } catch (error) {
            console.error('Error changing plan:', error);
            toast.error('Failed to change plan');
        } finally {
            setSwitching(null);
        }
    };

    const getPlanIcon = (planId: string) => {
        switch (planId) {
            case 'STARTER':
                return <Star className="w-5 h-5 text-blue-500" />;
            case 'PROFESSIONAL':
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case 'ENTERPRISE':
                return <Crown className="w-5 h-5 text-purple-500" />;
            default:
                return <Users className="w-5 h-5 text-gray-500" />;
        }
    };

    const getPlanColor = (planId: string) => {
        switch (planId) {
            case 'STARTER':
                return 'border-blue-200 bg-blue-50';
            case 'PROFESSIONAL':
                return 'border-green-200 bg-green-50';
            case 'ENTERPRISE':
                return 'border-purple-200 bg-purple-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const isCurrentPlan = (planId: string) => {
        return currentPlan === planId;
    };

    const isRecommended = (planId: string) => {
        return recommendation?.recommendedPlan === planId && planId !== currentPlan;
    };

    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Vendor Plan</h2>
                <p className="text-gray-600 mt-2">
                    Select the perfect plan for your business needs and scale as you grow
                </p>
            </div>

            {/* Performance Metrics (if vendor) */}
            {isVendor && metrics && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            Your Performance Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatPrice(metrics.totalSales, currency)}
                                </div>
                                <div className="text-sm text-gray-600">Monthly Sales</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {metrics.orderCount}
                                </div>
                                <div className="text-sm text-gray-600">Orders</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {metrics.averageRating.toFixed(1)}★
                                </div>
                                <div className="text-sm text-gray-600">Rating</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {metrics.activeProducts}
                                </div>
                                <div className="text-sm text-gray-600">Products</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan Recommendation */}
            {recommendation && recommendation.recommendedPlan !== recommendation.currentPlan && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-green-800">
                                    Recommended: {plans.find(p => p.id === recommendation.recommendedPlan)?.name}
                                </h3>
                                <p className="text-green-700 text-sm mt-1">
                                    {recommendation.reasoning}
                                </p>
                                {recommendation.potentialSavings > 0 && (
                                    <p className="text-green-600 font-medium text-sm mt-2">
                                        Potential monthly savings: {formatPrice(recommendation.potentialSavings, currency)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative ${getPlanColor(plan.id)} ${isCurrentPlan(plan.id) ? 'ring-2 ring-blue-500' : ''
                            } ${isRecommended(plan.id) ? 'ring-2 ring-green-500' : ''}`}
                    >
                        {/* Plan Header */}
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-2">
                                {getPlanIcon(plan.id)}
                            </div>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatPrice(plan.monthlyFee, currency)}
                                </div>
                                <CardDescription className="text-sm text-gray-600">
                                    per month
                                </CardDescription>
                            </div>
                        </CardHeader>

                        {/* Badges */}
                        <div className="px-6 pb-4">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {isCurrentPlan(plan.id) && (
                                    <Badge variant="default">Current Plan</Badge>
                                )}
                                {isRecommended(plan.id) && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Recommended
                                    </Badge>
                                )}
                                {plan.id === 'PROFESSIONAL' && (
                                    <Badge variant="outline">Most Popular</Badge>
                                )}
                            </div>
                        </div>

                        {/* Plan Details */}
                        <CardContent className="space-y-4">
                            {/* Commission & Fees */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Commission Rate</span>
                                    <span className="font-medium">{(plan.commissionRate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Transaction Fee</span>
                                    <span className="font-medium">{formatPrice(plan.transactionFee, currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Product Limit</span>
                                    <span className="font-medium">
                                        {plan.maxProducts ? plan.maxProducts.toLocaleString() : 'Unlimited'}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            {/* Benefits */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">What's included:</h4>
                                <ul className="space-y-1">
                                    {plan.benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4">
                                {isVendor ? (
                                    <Button
                                        onClick={() => handlePlanChange(plan.id)}
                                        disabled={isCurrentPlan(plan.id) || switching === plan.id}
                                        className="w-full"
                                        variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                                    >
                                        {switching === plan.id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Switching...
                                            </div>
                                        ) : isCurrentPlan(plan.id) ? (
                                            "Current Plan"
                                        ) : (
                                            `Switch to ${plan.name}`
                                        )}
                                    </Button>
                                ) : (
                                    <Button className="w-full" variant="outline">
                                        Get Started
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Currency Selector */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <span>Currency:</span>                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                    </select>
                </div>
            </div>

            {/* Performance Info */}
            <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-lg">Performance-Based Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-medium text-green-700 mb-2">Performance Bonuses</h4>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Rating ≥ 4.5: +0.5% bonus</li>
                                <li>• Fulfillment Rate ≥ 98%: +0.5% bonus</li>
                                <li>• Return Rate ≤ 2%: +0.3% bonus</li>
                                <li>• High Volume (100+ orders): +0.2% bonus</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 mb-2">Customer Benefits</h4>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Top Performers: 2% customer discount</li>
                                <li>• Good Performers: 1% customer discount</li>
                                <li>• Better service quality</li>
                                <li>• Priority listing placement</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
