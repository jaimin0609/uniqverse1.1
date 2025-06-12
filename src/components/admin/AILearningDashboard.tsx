"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Brain,
    TrendingUp,
    MessageSquare,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Save,
    Eye,
    BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LearningData {
    id: string;
    userMessage: string;
    expectedResponse?: string;
    frequency: number;
    status: string;
    lastOccurred: string;
    reviewedBy?: string;
}

interface AnalyticsData {
    totalConversations: number;
    totalMessages: number;
    avgSatisfaction: number;
    escalationRate: number;
    resolutionRate: number;
    avgResponseTime: number;
    topTopics: Array<{ topic: string; count: number }>;
    unmatchedQueries: number;
}

export default function AILearningDashboard() {
    const [learningData, setLearningData] = useState<LearningData[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<LearningData | null>(null);
    const [expectedResponse, setExpectedResponse] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchLearningData();
        fetchAnalytics();
    }, []);

    async function fetchLearningData() {
        try {
            const response = await fetch('/api/ai-learning');
            if (response.ok) {
                const data = await response.json();
                setLearningData(data.learningData || []);
            }
        } catch (error) {
            console.error("Error fetching learning data:", error);
            toast.error("Failed to load learning data");
        }
    }

    async function fetchAnalytics() {
        try {
            const response = await fetch('/api/ai-learning/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
            toast.error("Failed to load analytics");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleReviewItem(item: LearningData, response: string, status: 'implemented' | 'rejected') {
        setIsSaving(true);
        try {
            const apiResponse = await fetch('/api/ai-learning', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    expectedResponse: response,
                    status
                })
            });

            if (apiResponse.ok) {
                toast.success(`Learning item ${status} successfully`);
                await fetchLearningData();
                setSelectedItem(null);
                setExpectedResponse("");
            } else {
                throw new Error('Failed to update learning item');
            }
        } catch (error) {
            console.error("Error updating learning item:", error);
            toast.error("Failed to update learning item");
        } finally {
            setIsSaving(false);
        }
    } async function indexWebsiteContent() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/website-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'index_content' })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(`Successfully indexed ${data.count} pages`);
            } else {
                throw new Error('Failed to index website content');
            }
        } catch (error) {
            console.error("Error indexing content:", error);
            toast.error("Failed to index website content");
        } finally {
            setIsLoading(false);
        }
    }

    async function crawlWebsite() {
        setIsLoading(true);
        try {
            const baseUrl = window.location.origin;
            const response = await fetch('/api/ai-crawler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'crawl_sitemap',
                    data: { baseUrl }
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                await fetchAnalytics(); // Refresh analytics
            } else {
                throw new Error('Failed to crawl website');
            }
        } catch (error) {
            console.error("Error crawling website:", error);
            toast.error("Failed to crawl website");
        } finally {
            setIsLoading(false);
        }
    }

    async function autoLearn() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ai-learning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'auto_learn' })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                await fetchLearningData();
            } else {
                throw new Error('Failed to auto-learn');
            }
        } catch (error) {
            console.error("Error auto-learning:", error);
            toast.error("Failed to perform auto-learning");
        } finally {
            setIsLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Review</Badge>;
            case 'implemented':
                return <Badge variant="outline" className="text-green-600 border-green-600">Implemented</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-6 w-6 mr-2 animate-spin" />
                <p>Loading AI learning dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI Learning Dashboard</h1>
                    <p className="text-gray-600">Monitor and improve your AI chatbot's performance</p>
                </div>                <div className="flex gap-2">
                    <Button onClick={crawlWebsite} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Crawl Website
                    </Button>
                    <Button onClick={autoLearn} variant="outline">
                        <Brain className="h-4 w-4 mr-2" />
                        Auto Learn
                    </Button>
                    <Button onClick={indexWebsiteContent} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Index Website Content
                    </Button>
                    <Button onClick={() => { fetchLearningData(); fetchAnalytics(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="learning" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Learning Queue
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                    {analytics && (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics.totalConversations.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {analytics.totalMessages.toLocaleString()} total messages
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics.avgSatisfaction.toFixed(1)}/5</div>
                                        <p className="text-xs text-muted-foreground">
                                            {(analytics.avgSatisfaction / 5 * 100).toFixed(0)}% satisfaction rate
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{(analytics.resolutionRate * 100).toFixed(1)}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            Escalation rate: {(analytics.escalationRate * 100).toFixed(1)}%
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics.avgResponseTime.toFixed(1)}ms</div>
                                        <p className="text-xs text-muted-foreground">
                                            {analytics.unmatchedQueries} unmatched queries
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Top Topics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Conversation Topics</CardTitle>
                                    <CardDescription>Most frequently discussed topics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {analytics.topTopics.map((topic, index) => (
                                            <div key={topic.topic} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium capitalize">{topic.topic}</span>
                                                </div>
                                                <Badge variant="secondary">{topic.count} conversations</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="learning" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Learning Queue */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    Learning Queue
                                </CardTitle>
                                <CardDescription>
                                    Questions that need review for AI improvement
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {learningData.filter(item => item.status === 'pending').map((item) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setExpectedResponse(item.expectedResponse || "");
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{item.userMessage}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.frequency} time{item.frequency !== 1 ? 's' : ''}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(item.lastOccurred).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {getStatusBadge(item.status)}
                                            </div>
                                        </div>
                                    ))}
                                    {learningData.filter(item => item.status === 'pending').length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No pending items to review</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Review Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    Review Item
                                </CardTitle>
                                <CardDescription>
                                    Provide the expected response to improve AI learning
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedItem ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">User Question:</label>
                                            <div className="p-3 bg-gray-50 rounded border mt-1">
                                                {selectedItem.userMessage}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Asked {selectedItem.frequency} time{selectedItem.frequency !== 1 ? 's' : ''} •
                                                Last occurred: {new Date(selectedItem.lastOccurred).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">Expected Response:</label>
                                            <Textarea
                                                value={expectedResponse}
                                                onChange={(e) => setExpectedResponse(e.target.value)}
                                                placeholder="Provide the ideal response for this question..."
                                                className="mt-1"
                                                rows={4}
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleReviewItem(selectedItem, expectedResponse, 'implemented')}
                                                disabled={!expectedResponse.trim() || isSaving}
                                                className="flex-1"
                                            >
                                                {isSaving ? (
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Implement Response
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleReviewItem(selectedItem, "", 'rejected')}
                                                disabled={isSaving}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Select an item from the learning queue to review</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Reviews */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Reviews</CardTitle>
                            <CardDescription>Recently reviewed learning items</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {learningData.filter(item => item.status !== 'pending').slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.userMessage}</p>
                                            {item.expectedResponse && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Response: {item.expectedResponse.substring(0, 100)}...
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>
                                ))}
                                {learningData.filter(item => item.status !== 'pending').length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                        No reviewed items yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
