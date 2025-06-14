"use client";

import { useState, useEffect } from 'react';
import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    Clock,
    Headphones,
    Eye,
    Database
} from 'lucide-react';

interface MemoryStats {
    used: string;
    total: string;
    limit: string;
    percentage: number;
}

export function MemoryLeakDashboard() {
    const { generateReport } = useMemoryLeakDetection('MemoryLeakDashboard');
    const [report, setReport] = useState<any>(null);
    const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const generateCurrentReport = async () => {
        setIsLoading(true);
        try {
            const currentReport = generateReport();
            setReport(currentReport);

            // Get memory stats if available
            if (typeof window !== 'undefined' && 'memory' in performance) {
                const memory = (performance as any).memory;
                setMemoryStats({
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
                    percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
                });
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error generating memory report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateCurrentReport();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            generateCurrentReport();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRiskLevelIcon = (level: string) => {
        switch (level) {
            case 'low': return <CheckCircle className="h-4 w-4" />;
            case 'medium': return <AlertTriangle className="h-4 w-4" />;
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'critical': return <XCircle className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    const getPatternIcon = (type: string) => {
        switch (type) {
            case 'setInterval': return <Clock className="h-4 w-4" />;
            case 'setTimeout': return <Clock className="h-4 w-4" />;
            case 'addEventListener': return <Headphones className="h-4 w-4" />;
            case 'observer': return <Eye className="h-4 w-4" />;
            case 'subscription': return <Database className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Memory Leak Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor and detect memory leaks in real-time
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                    <Button
                        onClick={generateCurrentReport}
                        disabled={isLoading}
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Report
                    </Button>
                </div>
            </div>

            {lastUpdated && (
                <div className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Leaks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {report?.totalLeaks || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active memory leaks detected
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {report && getRiskLevelIcon(report.riskLevel)}
                            <Badge className={getRiskLevelColor(report?.riskLevel || 'low')}>
                                {report?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {memoryStats?.used || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {memoryStats ? `${memoryStats.percentage}% of ${memoryStats.limit}` : 'Memory info unavailable'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Patterns Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {report?.patterns?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Different leak types found
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Memory Usage Warning */}
            {memoryStats && memoryStats.percentage > 70 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        High memory usage detected ({memoryStats.percentage}%).
                        Consider running garbage collection or checking for memory leaks.
                    </AlertDescription>
                </Alert>
            )}

            {/* Leak Patterns */}
            {report?.patterns && report.patterns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detected Memory Leak Patterns</CardTitle>
                        <CardDescription>
                            Detailed breakdown of memory leak sources
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {report.patterns.map((pattern: any, index: number) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getPatternIcon(pattern.type)}
                                            <span className="font-medium">{pattern.type}</span>
                                        </div>
                                        <Badge className={getRiskLevelColor(pattern.severity)}>
                                            {pattern.severity.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {pattern.description}
                                    </p>
                                    <div className="text-sm">
                                        <strong>Count:</strong> {pattern.count}
                                    </div>
                                    {pattern.sources && pattern.sources.length > 0 && (
                                        <div className="text-sm mt-2">
                                            <strong>Sources:</strong>
                                            <ul className="list-disc list-inside ml-2 text-muted-foreground">
                                                {pattern.sources.map((source: string, idx: number) => (
                                                    <li key={idx}>{source}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {report?.recommendations && report.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                        <CardDescription>
                            Suggested actions to fix detected memory leaks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {report.recommendations.map((recommendation: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                    <span className="text-sm">{recommendation}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* No Leaks Detected */}
            {report && report.totalLeaks === 0 && (
                <Card>
                    <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-green-800 mb-2">
                                No Memory Leaks Detected
                            </h3>
                            <p className="text-muted-foreground">
                                Your application is running cleanly with no detected memory leaks.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
