"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Palette, Settings, Eye, Plus, TrendingUp } from "lucide-react";

interface CustomizationStats {
    totalTemplates: number;
    totalDesigns: number;
    activeProducts: number;
    recentDesigns: number;
}

export default function CustomizationDashboard() {
    const [stats, setStats] = useState<CustomizationStats>({
        totalTemplates: 0,
        totalDesigns: 0,
        activeProducts: 0,
        recentDesigns: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // For now, we'll use mock data. In a real implementation, 
            // you would fetch this from your API
            setStats({
                totalTemplates: 8,
                totalDesigns: 24,
                activeProducts: 2,
                recentDesigns: 5
            });
        } catch (error) {
            console.error('Error fetching customization stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customization Management</h1>
                    <p className="text-gray-600">Manage product customization templates and customer designs</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                        <Palette className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                        <p className="text-xs text-muted-foreground">Active customization templates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custom Designs</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDesigns}</div>
                        <p className="text-xs text-muted-foreground">Created by customers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customizable Products</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeProducts}</div>
                        <p className="text-xs text-muted-foreground">Products with customization enabled</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Designs</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recentDesigns}</div>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Templates
                        </CardTitle>
                        <CardDescription>
                            Manage customization templates for your products
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary">{stats.totalTemplates} active</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin/customization/templates">
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View All
                                </Button>
                            </Link>
                            <Link href="/admin/customization/templates/create">
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Custom Designs
                        </CardTitle>
                        <CardDescription>
                            Browse and manage customer-created designs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary">{stats.totalDesigns} total</Badge>
                        </div>
                        <Link href="/admin/customization/designs">
                            <Button variant="outline" size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                View All Designs
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Settings
                        </CardTitle>
                        <CardDescription>
                            Configure customization pricing and rules
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-gray-600">
                            Manage pricing, file formats, and restrictions
                        </div>
                        <Link href="/admin/customization/settings">
                            <Button variant="outline" size="sm" className="w-full">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure Settings
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest customization activity and designs</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="font-medium">New custom design created</p>
                                <p className="text-sm text-gray-600">Customer designed a Custom T-Shirt • 2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="font-medium">Template updated</p>
                                <p className="text-sm text-gray-600">Hoodie customization template modified • 5 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="font-medium">Order with custom design</p>
                                <p className="text-sm text-gray-600">Order #1234 includes customized product • 1 day ago</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
