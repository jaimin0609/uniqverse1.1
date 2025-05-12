"use client";

import { useState } from "react";
import { FileText, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContentPage() {
    const [activeTab, setActiveTab] = useState("overview");

    const contentTypes = [
        {
            title: "Pages",
            icon: <FileText className="h-8 w-8 text-blue-500" />,
            description: "Manage static pages like About, Contact, Terms of Service",
            count: 8,
            href: "/admin/content/pages",
            lastUpdated: "Apr 30, 2025"
        },
        {
            title: "Blog Posts",
            icon: <BookOpen className="h-8 w-8 text-purple-500" />,
            description: "Create and manage blog articles and news items",
            count: 12,
            href: "/admin/content/blog",
            lastUpdated: "May 2, 2025"
        }
    ];

    const recentlyUpdated = [
        {
            title: "About Us",
            type: "Page",
            updatedAt: "Apr 30, 2025 - 14:32",
            updatedBy: "James Smith",
            href: "/admin/content/pages/about"
        },
        {
            title: "Top 10 Custom Design Trends for 2025",
            type: "Blog Post",
            updatedAt: "May 2, 2025 - 09:15",
            updatedBy: "Sarah Johnson",
            href: "/admin/content/blog/top-10-custom-design-trends"
        },
        {
            title: "Privacy Policy",
            type: "Page",
            updatedAt: "Apr 29, 2025 - 16:45",
            updatedBy: "James Smith",
            href: "/admin/content/pages/privacy"
        },
        {
            title: "How to Care for Custom Products",
            type: "Blog Post",
            updatedAt: "Apr 28, 2025 - 11:20",
            updatedBy: "Sarah Johnson",
            href: "/admin/content/blog/how-to-care-for-custom-products"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
            </div>

            <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="recent">Recent Updates</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contentTypes.map((type) => (
                            <Link href={type.href} key={type.title}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xl font-bold">{type.title}</CardTitle>
                                        {type.icon}
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-sm mb-2">{type.description}</CardDescription>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{type.count} items</span>
                                            <span className="text-gray-500">Last updated: {type.lastUpdated}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Updated</CardTitle>
                            <CardDescription>
                                Content items that have been recently edited or created
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentlyUpdated.map((item) => (
                                    <Link href={item.href} key={item.title}>
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.title}</span>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 mr-2">
                                                        {item.type}
                                                    </span>
                                                    <span>{item.updatedAt}</span>
                                                    <span className="mx-2">by</span>
                                                    <span>{item.updatedBy}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}