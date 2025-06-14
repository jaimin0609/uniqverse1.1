"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    RefreshCw,
    Play,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Database,
    Image,
    MemoryStick,
    Trash2,
    Download,
    AlertTriangle
} from 'lucide-react';

interface TestResult {
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    details?: any;
    error?: string;
}

interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
}

export default function PerformanceTestPanel() {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPerformingAction, setIsPerformingAction] = useState<string | null>(null);

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);
        setTestSummary(null);

        try {
            const response = await fetch('/api/test-performance');
            const data = await response.json();

            if (data.success) {
                setTestResults(data.results.tests);
                setTestSummary(data.summary);
            } else {
                console.error('Tests failed:', data.error);
            }
        } catch (error) {
            console.error('Failed to run tests:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const performAction = async (action: string, label: string) => {
        setIsPerformingAction(label);

        try {
            const response = await fetch('/api/test-performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (data.success) {
                console.log(`${label} completed:`, data);
                // Optionally refresh tests after action
                if (action !== 'flushCache') {
                    await runTests();
                }
            } else {
                console.error(`${label} failed:`, data.error);
            }
        } catch (error) {
            console.error(`Failed to perform ${label}:`, error);
        } finally {
            setIsPerformingAction(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'fail':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTestIcon = (testName: string) => {
        if (testName.includes('Cache')) return <Database className="h-4 w-4" />;
        if (testName.includes('Memory')) return <MemoryStick className="h-4 w-4" />;
        if (testName.includes('Image')) return <Image className="h-4 w-4" />;
        return <Zap className="h-4 w-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Test Controls */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={runTests}
                    disabled={isRunning || isPerformingAction !== null}
                    className="flex items-center space-x-2"
                >
                    {isRunning ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                    <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={() => performAction('warmCache', 'Warm Cache')}
                    disabled={isRunning || isPerformingAction !== null}
                    className="flex items-center space-x-2"
                >
                    <Zap className="h-4 w-4" />
                    <span>{isPerformingAction === 'Warm Cache' ? 'Warming...' : 'Warm Cache'}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={() => performAction('optimizeMemory', 'Optimize Memory')}
                    disabled={isRunning || isPerformingAction !== null}
                    className="flex items-center space-x-2"
                >
                    <MemoryStick className="h-4 w-4" />
                    <span>{isPerformingAction === 'Optimize Memory' ? 'Optimizing...' : 'Optimize Memory'}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={() => performAction('cleanupImages', 'Cleanup Images')}
                    disabled={isRunning || isPerformingAction !== null}
                    className="flex items-center space-x-2"
                >
                    <Image className="h-4 w-4" />
                    <span>{isPerformingAction === 'Cleanup Images' ? 'Cleaning...' : 'Cleanup Images'}</span>
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => performAction('flushCache', 'Flush All Cache')}
                    disabled={isRunning || isPerformingAction !== null}
                    className="flex items-center space-x-2"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>{isPerformingAction === 'Flush All Cache' ? 'Flushing...' : 'Flush All Cache'}</span>
                </Button>
            </div>

            {/* Test Summary */}
            {testSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Test Results Summary</span>
                            <Badge variant={testSummary.successRate === 100 ? "default" : testSummary.successRate >= 80 ? "secondary" : "destructive"}>
                                {testSummary.successRate}% Success Rate
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{testSummary.passed}</div>
                                <div className="text-sm text-gray-500">Passed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{testSummary.failed}</div>
                                <div className="text-sm text-gray-500">Failed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{testSummary.total}</div>
                                <div className="text-sm text-gray-500">Total</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Progress value={testSummary.successRate} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Individual Test Results */}
            {testResults.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Detailed Test Results</h3>
                    {testResults.map((test, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex items-center space-x-2">
                                        {getTestIcon(test.name)}
                                        <span>{test.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(test.status)}
                                        <Badge variant="outline">{test.duration}ms</Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {test.status === 'fail' && test.error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{test.error}</AlertDescription>
                                    </Alert>
                                )}

                                {test.details && (
                                    <div className="bg-gray-50 rounded-md p-3">
                                        <h4 className="font-medium mb-2">Details:</h4>
                                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {JSON.stringify(test.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Help Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div><strong>Redis Cache System:</strong> Tests basic cache operations, Redis connectivity, and performance metrics</div>
                        <div><strong>Pattern-based Cache Operations:</strong> Tests advanced cache pattern matching, bulk operations, and statistics</div>
                        <div><strong>Cache Invalidation System:</strong> Tests cache invalidation patterns and product-specific invalidation</div>
                        <div><strong>Memory Optimizer:</strong> Tests memory usage monitoring, leak detection, and optimization features</div>
                        <div><strong>Image Optimizer:</strong> Tests image optimization statistics, cache stats, and performance metrics</div>
                        <div><strong>Cache Cleanup System:</strong> Tests automated cache cleanup and maintenance operations</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
