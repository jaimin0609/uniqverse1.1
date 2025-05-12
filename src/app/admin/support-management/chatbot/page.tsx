"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatbotPatternManager from "@/components/support/ChatbotPatternManager";
import {
    Bot,
    Settings,
    Terminal,
    MessageSquare,
    Info,
    BarChart4
} from "lucide-react";
import { useState } from "react";

export default function ChatbotManagementPage() {
    const [activeTab, setActiveTab] = useState("patterns");

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Chatbot Settings</h1>
                <p className="text-gray-600">
                    Manage your AI chatbot patterns, responses, and behavior
                </p>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
                    <TabsTrigger value="patterns" className="text-base py-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Response Patterns
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-base py-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configuration
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-base py-3 flex items-center gap-2">
                        <BarChart4 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Response Patterns */}
                <TabsContent value="patterns" className="space-y-6">
                    <ChatbotPatternManager />
                </TabsContent>

                {/* Configuration */}
                <TabsContent value="settings" className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Chatbot Configuration</h2>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">General Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Chatbot Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Uniqverse Support"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Welcome Message</label>
                                        <input
                                            type="text"
                                            defaultValue="Welcome to Uniqverse support! How can I help you today?"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Chatbot Behavior</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="followUp" defaultChecked />
                                            <label htmlFor="followUp">Enable follow-up question detection</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="keywordMatching" defaultChecked />
                                            <label htmlFor="keywordMatching">Enable smart keyword matching</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="contextRetention" defaultChecked />
                                            <label htmlFor="contextRetention">Remember conversation context</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Appearance</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Chatbot Button Color</label>
                                        <select
                                            defaultValue="blue"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="blue">Blue</option>
                                            <option value="green">Green</option>
                                            <option value="purple">Purple</option>
                                            <option value="red">Red</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Chat Window Size</label>
                                        <select
                                            defaultValue="medium"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Position</label>
                                        <select
                                            defaultValue="bottom-right"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="top-left">Top Left</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Advanced Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Minimum Score for Match</label>
                                        <div className="flex items-center">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                defaultValue="2"
                                                className="w-full"
                                            />
                                            <span className="ml-2">2</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Higher values require more exact matches but may increase no-matches</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Maximum Conversation Length</label>
                                        <input
                                            type="number"
                                            defaultValue="50"
                                            min="10"
                                            max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500">Maximum number of messages to store in conversation history</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Analytics */}
                <TabsContent value="analytics" className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Chatbot Analytics</h2>
                            <div className="flex items-center gap-2">
                                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="90days">Last 90 days</option>
                                    <option value="year">Last year</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Total Conversations</h3>
                                <p className="text-3xl font-bold">1,247</p>
                                <p className="text-sm text-green-600 mt-1">↑ 12% from previous period</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Average Satisfaction</h3>
                                <p className="text-3xl font-bold">4.2/5</p>
                                <p className="text-sm text-green-600 mt-1">↑ 0.3 from previous period</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Escalation Rate</h3>
                                <p className="text-3xl font-bold">18%</p>
                                <p className="text-sm text-red-600 mt-1">↑ 2% from previous period</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4">Conversation Volume</h3>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">Chart placeholder: Conversation volume over time</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Top Topics</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span>Shipping Information</span>
                                        <span className="font-medium">32%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '32%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span>Return Policy</span>
                                        <span className="font-medium">24%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span>Order Status</span>
                                        <span className="font-medium">18%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '18%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span>Payment Issues</span>
                                        <span className="font-medium">15%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span>Account Help</span>
                                        <span className="font-medium">11%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '11%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-4">Unmatched Queries</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                                    <div className="space-y-3">
                                        <div className="p-3 bg-white rounded-md border border-gray-200">
                                            "Do you have a physical store I can visit?"
                                        </div>
                                        <div className="p-3 bg-white rounded-md border border-gray-200">
                                            "How do I track my order if I checked out as a guest?"
                                        </div>
                                        <div className="p-3 bg-white rounded-md border border-gray-200">
                                            "Can I change the size of my order after placing it?"
                                        </div>
                                        <div className="p-3 bg-white rounded-md border border-gray-200">
                                            "Do you offer gift wrapping services?"
                                        </div>
                                        <div className="p-3 bg-white rounded-md border border-gray-200">
                                            "What materials are your products made from?"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}