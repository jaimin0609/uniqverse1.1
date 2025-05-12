"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FAQManagement from "@/components/support/FAQManagement";
import { AdminTicketDashboard } from "@/components/admin/AdminTicketDashboard";
import { Headphones, MessageSquare, HelpCircle } from "lucide-react";

export default function SupportManagementPage() {
    // We could fetch initial FAQs from an API here

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Support Management</h1>
                <p className="text-gray-600">
                    Manage your support system, FAQs, and AI chatbot knowledge base.
                </p>
            </div>

            <Tabs defaultValue="faqs" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
                    <TabsTrigger value="faqs" className="text-base py-3 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        FAQs Management
                    </TabsTrigger>
                    <TabsTrigger value="chatbot" className="text-base py-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        AI Chatbot Configuration
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="text-base py-3 flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        Support Tickets
                    </TabsTrigger>
                </TabsList>

                {/* FAQs Management */}
                <TabsContent value="faqs" className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <FAQManagement
                            categories={[
                                "Orders & Shipping",
                                "Returns & Refunds",
                                "Payment & Billing",
                                "Account & Privacy",
                                "Products & Inventory",
                                "Website & Technical"
                            ]}
                        />
                    </div>
                </TabsContent>

                {/* AI Chatbot Configuration */}
                <TabsContent value="chatbot" className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold mb-4">AI Chatbot Configuration</h2>
                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-amber-800">
                                    This feature allows you to edit the knowledge base that powers your AI chatbot.
                                    Changes made here will affect how the chatbot responds to customer inquiries.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium mb-2">Knowledge Base Status</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                                        <span className="text-green-600 font-medium">Active</span>
                                    </div>
                                    <p className="text-gray-600 mt-1">
                                        Last updated: May 7, 2025 at 9:30 AM
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-2">OpenAI API Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                API Key Status
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                                                <span className="text-green-600 font-medium">Connected</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Model
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                <option value="gpt-4">GPT-4</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-2">Edit Knowledge Base</h3>
                                <p className="text-gray-600 mb-4">
                                    Update the information that your AI chatbot uses to answer customer questions.
                                </p>

                                {/* This would be expanded with actual forms for editing knowledge base sections */}
                                <div className="bg-gray-50 p-4 rounded-lg text-center">
                                    <p className="text-gray-500">Knowledge base editor functionality coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Support Tickets */}
                <TabsContent value="tickets" className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold mb-4">Support Tickets</h2>
                        <AdminTicketDashboard />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}