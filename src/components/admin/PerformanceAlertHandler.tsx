"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Zap,
    Database,
    Image,
    Server,
    RefreshCw,
    TrendingUp,
    Target,
    Play,
    Loader2
} from 'lucide-react';

interface PerformanceAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    resolved: boolean;
    category: 'database' | 'cache' | 'api' | 'images' | 'system';
    impact: string;
    recommendedActions: Array<{
        title: string;
        description: string;
        action: string;
        params?: any;
        estimatedTime: string;
        difficulty: 'easy' | 'medium' | 'hard';
    }>;
}

interface PerformanceAlertHandlerProps {
    alerts: PerformanceAlert[];
    onAlertResolved: (alertId: string) => void;
    onOptimizationExecuted: (action: string, params?: any) => void;
}

export default function PerformanceAlertHandler({
    alerts,
    onAlertResolved,
    onOptimizationExecuted
}: PerformanceAlertHandlerProps) {
    const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

    const executeOptimization = async (action: string, params?: any) => {
        setProcessingActions(prev => new Set(prev).add(action));

        try {
            const response = await fetch('/api/admin/performance/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, params })
            });

            const result = await response.json();

            if (result.success) {
                setCompletedActions(prev => new Set(prev).add(action));
                onOptimizationExecuted(action, params);

                // Show success notification
                console.log(`✅ ${action} completed successfully:`, result.message);
            } else {
                console.error(`❌ ${action} failed:`, result.error);
            }
        } catch (error) {
            console.error(`❌ Failed to execute ${action}:`, error);
        } finally {
            setProcessingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(action);
                return newSet;
            });
        }
    };

    const getAlertIcon = (severity: string, type: string) => {
        if (type === 'error' || severity === 'critical') {
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
        }
        if (severity === 'high') {
            return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        }
        if (severity === 'medium') {
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        }
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'database': return <Database className="h-4 w-4" />;
            case 'cache': return <Zap className="h-4 w-4" />;
            case 'api': return <Server className="h-4 w-4" />;
            case 'images': return <Image className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const activeAlerts = alerts.filter(alert => !alert.resolved);
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');

    return (
        <div className="space-y-6">
            {/* Alert Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Performance Alert Center
                    </CardTitle>
                    <CardDescription>
                        Active performance issues and optimization recommendations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
                            <div className="text-sm text-red-600">Critical Issues</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
                            <div className="text-sm text-orange-600">High Priority</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{activeAlerts.length}</div>
                            <div className="text-sm text-blue-600">Total Alerts</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{completedActions.size}</div>
                            <div className="text-sm text-green-600">Optimizations Done</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts */}
            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
                    <TabsTrigger value="recommendations">Quick Fixes</TabsTrigger>
                    <TabsTrigger value="history">Alert History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeAlerts.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-green-600">All Clear!</h3>
                                <p className="text-muted-foreground">No active performance alerts</p>
                            </CardContent>
                        </Card>
                    ) : (
                        activeAlerts.map((alert) => (
                            <Card key={alert.id} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' :
                                    alert.severity === 'high' ? 'border-l-orange-500' :
                                        alert.severity === 'medium' ? 'border-l-yellow-500' :
                                            'border-l-blue-500'
                                }`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {getAlertIcon(alert.severity, alert.type)}
                                            <div>
                                                <CardTitle className="text-lg">{alert.message}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    {getCategoryIcon(alert.category)}
                                                    <span className="capitalize">{alert.category}</span>
                                                    <span>•</span>
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className={getSeverityColor(alert.severity)}>
                                            {alert.severity.toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">Impact:</h4>
                                        <p className="text-muted-foreground">{alert.impact}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3">Recommended Actions:</h4>
                                        <div className="space-y-3">
                                            {alert.recommendedActions.map((action, index) => (
                                                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="font-medium">{action.title}</h5>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {action.description}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                                <span>⏱️ {action.estimatedTime}</span>
                                                                <span>🔧 {action.difficulty}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant={completedActions.has(action.action) ? "outline" : "default"}
                                                            disabled={processingActions.has(action.action)}
                                                            onClick={() => executeOptimization(action.action, action.params)}
                                                            className="ml-4"
                                                        >
                                                            {processingActions.has(action.action) ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Running...
                                                                </>
                                                            ) : completedActions.has(action.action) ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Done
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play className="h-4 w-4 mr-2" />
                                                                    Execute
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-500" />
                                Quick Performance Fixes
                            </CardTitle>
                            <CardDescription>
                                One-click optimizations you can run right now
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">🚀 Optimize Cache</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Pre-warm cache with popular content for 15-25% faster response times
                                    </p>
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        disabled={processingActions.has('optimize_cache')}
                                        onClick={() => executeOptimization('optimize_cache')}
                                    >
                                        {processingActions.has('optimize_cache') ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Optimizing...
                                            </>
                                        ) : (
                                            'Optimize Cache'
                                        )}
                                    </Button>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">🔍 Analyze Slow Queries</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Identify database bottlenecks and get optimization suggestions
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        disabled={processingActions.has('analyze_slow_queries')}
                                        onClick={() => executeOptimization('analyze_slow_queries')}
                                    >
                                        {processingActions.has('analyze_slow_queries') ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            'Analyze Queries'
                                        )}
                                    </Button>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">🖼️ Optimize Images</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Compress and optimize unprocessed images for faster loading
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        disabled={processingActions.has('optimize_images')}
                                        onClick={() => executeOptimization('optimize_images')}
                                    >
                                        {processingActions.has('optimize_images') ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Optimize Images'
                                        )}
                                    </Button>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">🔄 Clear Cache</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Clear all cached data to resolve stale content issues
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full"
                                        disabled={processingActions.has('clear_cache')}
                                        onClick={() => executeOptimization('clear_cache')}
                                    >
                                        {processingActions.has('clear_cache') ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Clearing...
                                            </>
                                        ) : (
                                            'Clear Cache'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardContent className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">Alert History</h3>
                            <p className="text-muted-foreground">
                                Historical alert data will be displayed here
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
