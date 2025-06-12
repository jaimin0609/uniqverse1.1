"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ChatbotPatternManager from "@/components/support/ChatbotPatternManager";
import {
    Bot,
    Settings,
    Terminal,
    MessageSquare,
    Info,
    BarChart4,
    Save,
    RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ChatbotManagementPage() {
    const [activeTab, setActiveTab] = useState("patterns");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("30days");

    // Configuration state
    const [config, setConfig] = useState({
        openai_model: 'gpt-3.5-turbo',
        response_temperature: 0.7,
        max_response_tokens: 500,
        confidence_threshold: 0.75,
        product_search_limit: 6,
        fuzzy_search_tolerance: 0.6,
        enable_product_search: true,
        show_product_images: true,
        fallback_products: true,
        enable_smart_rating: true,
        track_user_interactions: true,
        enable_feedback_buttons: true,
        enable_learning: true,
        track_unmatched: true,
        chatbot_name: 'UniQVerse AI Support',
        welcome_message: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more.',
        max_conversation_length: 50,
        session_timeout_minutes: 30,
        chatbot_color: 'blue',
        chat_window_size: 'medium',
        chatbot_position: 'bottom-right'
    });

    // Load configuration on mount
    useEffect(() => {
        loadConfig();
    }, []);

    // Load analytics when analytics tab is active
    useEffect(() => {
        if (activeTab === 'analytics') {
            loadAnalytics();
        }
    }, [activeTab, selectedPeriod]);

    const loadConfig = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/chatbot-config');
            const data = await response.json();

            if (data.success) {
                setConfig(data.config);
            } else {
                toast.error('Failed to load configuration');
            }
        } catch (error) {
            console.error('Failed to load config:', error);
            toast.error('Failed to load configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfig = async () => {
        try {
            setIsSaving(true);
            const response = await fetch('/api/admin/chatbot-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Configuration saved successfully!');
            } else {
                toast.error(data.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Failed to save config:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const response = await fetch(`/api/admin/chatbot-analytics?period=${selectedPeriod}`);
            const data = await response.json();

            if (data.success) {
                setAnalytics(data.analytics);
            } else {
                toast.error('Failed to load analytics');
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const updateConfig = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="container py-8">            <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Chatbot Settings</h1>
            <p className="text-gray-600">
                Manage your AI-powered chatbot with OpenAI integration, product search capabilities, and smart analytics
            </p>
        </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
                    <TabsTrigger value="patterns" className="text-base py-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Pattern Fallbacks
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-base py-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        AI Configuration
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-base py-3 flex items-center gap-2">
                        <BarChart4 className="h-4 w-4" />
                        AI Analytics
                    </TabsTrigger>
                </TabsList>                {/* Response Patterns */}
                <TabsContent value="patterns" className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-800">AI + Pattern Hybrid System</h3>
                            <p className="text-blue-700 text-sm mt-1">
                                Your chatbot now uses <strong>AI-first responses</strong> with OpenAI integration. The patterns below serve as <strong>fallbacks</strong> when the AI confidence is low or for specific edge cases. The AI handles most conversations intelligently, while patterns ensure reliable responses for critical scenarios.
                            </p>
                            <div className="mt-2 text-xs text-blue-600">
                                <strong>How it works:</strong> AI processes the query → If confidence &gt; 75%, AI responds → Otherwise, pattern matching kicks in → Final fallback to generic responses
                            </div>
                        </div>
                    </div>

                    <ChatbotPatternManager />
                </TabsContent>                {/* Configuration */}
                <TabsContent value="settings" className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">AI Chatbot Configuration</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={loadConfig}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Reload
                                </Button>
                                <Button
                                    onClick={saveConfig}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* OpenAI Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">OpenAI Configuration</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">API Status</label>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                                            <span className="text-green-600 font-medium">Connected</span>
                                            <span className="text-xs text-gray-500">(API Key configured)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">AI Model</label>
                                        <select
                                            value={config.openai_model}
                                            onChange={(e) => updateConfig('openai_model', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</option>
                                            <option value="gpt-4">GPT-4 (Premium)</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Response Temperature</label>
                                        <div className="flex items-center">
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={config.response_temperature}
                                                onChange={(e) => updateConfig('response_temperature', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <span className="ml-2">{config.response_temperature}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Controls creativity vs consistency (0.1-2.0)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Max Response Tokens</label>
                                        <input
                                            type="number"
                                            value={config.max_response_tokens}
                                            onChange={(e) => updateConfig('max_response_tokens', parseInt(e.target.value))}
                                            min="50"
                                            max="1500"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500">Maximum length of AI responses</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Confidence Threshold</label>
                                        <div className="flex items-center">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={config.confidence_threshold}
                                                onChange={(e) => updateConfig('confidence_threshold', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <span className="ml-2">{config.confidence_threshold}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Minimum confidence for AI responses</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Search Integration */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">AI Product Search Integration</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Search Results Limit</label>
                                        <input
                                            type="number"
                                            value={config.product_search_limit}
                                            onChange={(e) => updateConfig('product_search_limit', parseInt(e.target.value))}
                                            min="2"
                                            max="12"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500">Maximum products to show in search results</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Fuzzy Search Tolerance</label>
                                        <div className="flex items-center">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="0.9"
                                                step="0.1"
                                                value={config.fuzzy_search_tolerance}
                                                onChange={(e) => updateConfig('fuzzy_search_tolerance', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <span className="ml-2">{config.fuzzy_search_tolerance}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">How flexible the product search matching is</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Product Search Features</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="enableProductSearch"
                                                checked={config.enable_product_search}
                                                onChange={(e) => updateConfig('enable_product_search', e.target.checked)}
                                            />
                                            <label htmlFor="enableProductSearch">Enable AI product search and recommendations</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="showProductImages"
                                                checked={config.show_product_images}
                                                onChange={(e) => updateConfig('show_product_images', e.target.checked)}
                                            />
                                            <label htmlFor="showProductImages">Show product thumbnails in search results</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="fallbackProducts"
                                                checked={config.fallback_products}
                                                onChange={(e) => updateConfig('fallback_products', e.target.checked)}
                                            />
                                            <label htmlFor="fallbackProducts">Show fallback products when no matches found</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Smart Rating System */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Smart Rating & Analytics</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Rating Collection</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="enableSmartRating"
                                                    checked={config.enable_smart_rating}
                                                    onChange={(e) => updateConfig('enable_smart_rating', e.target.checked)}
                                                />
                                                <label htmlFor="enableSmartRating">Enable smart rating system</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="trackUserInteractions"
                                                    checked={config.track_user_interactions}
                                                    onChange={(e) => updateConfig('track_user_interactions', e.target.checked)}
                                                />
                                                <label htmlFor="trackUserInteractions">Track user interaction patterns</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="enableFeedbackButtons"
                                                    checked={config.enable_feedback_buttons}
                                                    onChange={(e) => updateConfig('enable_feedback_buttons', e.target.checked)}
                                                />
                                                <label htmlFor="enableFeedbackButtons">Show helpful/not helpful buttons</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Learning System</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="enableLearning"
                                                    checked={config.enable_learning}
                                                    onChange={(e) => updateConfig('enable_learning', e.target.checked)}
                                                />
                                                <label htmlFor="enableLearning">Enable AI learning from conversations</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="trackUnmatched"
                                                    checked={config.track_unmatched}
                                                    onChange={(e) => updateConfig('track_unmatched', e.target.checked)}
                                                />
                                                <label htmlFor="trackUnmatched">Track unmatched queries for improvement</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* General Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">General Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Chatbot Name</label>
                                        <input
                                            type="text"
                                            value={config.chatbot_name}
                                            onChange={(e) => updateConfig('chatbot_name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Welcome Message</label>
                                        <input
                                            type="text"
                                            value={config.welcome_message}
                                            onChange={(e) => updateConfig('welcome_message', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Maximum Conversation Length</label>
                                        <input
                                            type="number"
                                            value={config.max_conversation_length}
                                            onChange={(e) => updateConfig('max_conversation_length', parseInt(e.target.value))}
                                            min="10"
                                            max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500">Maximum number of messages to store in conversation history</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                                        <input
                                            type="number"
                                            value={config.session_timeout_minutes}
                                            onChange={(e) => updateConfig('session_timeout_minutes', parseInt(e.target.value))}
                                            min="5"
                                            max="120"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500">Auto-end conversations after inactivity</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appearance */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Appearance</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Chatbot Button Color</label>
                                        <select
                                            value={config.chatbot_color}
                                            onChange={(e) => updateConfig('chatbot_color', e.target.value)}
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
                                            value={config.chat_window_size}
                                            onChange={(e) => updateConfig('chat_window_size', e.target.value)}
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
                                            value={config.chatbot_position}
                                            onChange={(e) => updateConfig('chatbot_position', e.target.value)}
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
                        </div>
                    </div>
                </TabsContent>{/* Analytics */}
                <TabsContent value="analytics" className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">                        <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">AI Chatbot Analytics</h2>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7days">Last 7 days</option>
                                <option value="30days">Last 30 days</option>
                                <option value="90days">Last 90 days</option>
                                <option value="year">Last year</option>
                            </select>
                            <Button
                                onClick={loadAnalytics}
                                disabled={analyticsLoading}
                                size="sm"
                            >
                                {analyticsLoading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Refresh Data
                            </Button>
                        </div>
                    </div>                        {/* Key Metrics */}
                        {analyticsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-8 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : analytics ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Total Conversations</h3>
                                    <p className="text-3xl font-bold">{analytics.totalConversations.toLocaleString()}</p>
                                    <p className={`text-sm mt-1 ${analytics.conversationGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {analytics.conversationGrowth > 0 ? '↑' : '↓'} {Math.abs(analytics.conversationGrowth)}% from previous period
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">AI-powered conversations</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Average AI Confidence</h3>
                                    <p className="text-3xl font-bold">{analytics.avgConfidence}%</p>
                                    <p className="text-sm text-blue-600 mt-1">AI response confidence</p>
                                    <p className="text-xs text-gray-500 mt-1">Based on {analytics.totalMessages} messages</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Smart Rating Score</h3>
                                    <p className="text-3xl font-bold">{analytics.avgSatisfaction}/5</p>
                                    <p className="text-sm text-green-600 mt-1">User satisfaction rating</p>
                                    <p className="text-xs text-gray-500 mt-1">From user feedback</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Product Search Success</h3>
                                    <p className="text-3xl font-bold">{analytics.productSearchSuccess}%</p>
                                    <p className="text-sm text-green-600 mt-1">Successful product searches</p>
                                    <p className="text-xs text-gray-500 mt-1">AI search effectiveness</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Total Conversations</h3>
                                    <p className="text-3xl font-bold">0</p>
                                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Average AI Confidence</h3>
                                    <p className="text-3xl font-bold">0%</p>
                                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Smart Rating Score</h3>
                                    <p className="text-3xl font-bold">0/5</p>
                                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Product Search Success</h3>
                                    <p className="text-3xl font-bold">0%</p>
                                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                                </div>
                            </div>
                        )}                        {/* Additional AI Metrics */}
                        {analytics && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Escalation Rate</h3>
                                    <p className="text-3xl font-bold">{analytics.escalationRate}%</p>
                                    <p className="text-sm text-gray-500 mt-1">AI couldn't resolve</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Avg Response Time</h3>
                                    <p className="text-3xl font-bold">{analytics.avgResponseTime}s</p>
                                    <p className="text-sm text-gray-500 mt-1">AI processing time</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-2">Follow-up Rate</h3>
                                    <p className="text-3xl font-bold">{analytics.followUpRate}%</p>
                                    <p className="text-sm text-gray-500 mt-1">Users ask follow-ups</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4">AI Performance Trends</h3>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-gray-500 mb-2">Chart: AI confidence, response time, and satisfaction over time</p>
                                    <p className="text-xs text-gray-400">Integration with real analytics coming soon</p>
                                </div>
                            </div>
                        </div>                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Top AI Intent Categories</h3>
                                {analytics && analytics.topIntents ? (
                                    <div className="space-y-3">
                                        {analytics.topIntents.map((intent: any, index: number) => (
                                            <div key={index}>
                                                <div className="flex items-center justify-between">
                                                    <span>{intent.name}</span>
                                                    <span className="font-medium">{intent.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${intent.percentage}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center py-8">
                                        No intent data available yet
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-4">AI Learning Opportunities</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                                    {analytics && analytics.learningOpportunities && analytics.learningOpportunities.length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.learningOpportunities.map((opportunity: any, index: number) => (
                                                <div key={index} className="p-3 bg-white rounded-md border border-gray-200">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-sm font-medium">{opportunity.type}</span>
                                                        <span className={`text-xs ${opportunity.type.includes('Low') ? 'text-red-600' : 'text-orange-600'}`}>
                                                            {opportunity.metric}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">"{opportunity.query}"</p>
                                                    <p className="text-xs text-blue-600 mt-1">Suggested: {opportunity.suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            <p>No learning opportunities found.</p>
                                            <p className="text-xs mt-1">This means your AI is performing well!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}