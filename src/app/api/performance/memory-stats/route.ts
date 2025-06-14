import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Since memory optimizer uses React hooks and is client-side only,
        // we'll return server memory stats as a fallback
        const memoryUsage = process.memoryUsage();

        return NextResponse.json({
            success: true,
            serverMemory: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
                external: memoryUsage.external,
                percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
            },
            note: 'Full memory optimization features available in client components only',
            clientMemoryOptimizer: {
                available: true,
                requiresClientSide: true,
                features: [
                    'Real-time memory monitoring',
                    'Memory leak detection',
                    'Component memory tracking',
                    'Automatic cleanup triggers'
                ]
            }
        });
    } catch (error) {
        console.error('Failed to get memory stats:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve memory statistics',
                serverMemory: {
                    used: 0,
                    total: 0,
                    rss: 0,
                    external: 0,
                    percentage: 0
                }
            },
            { status: 500 }
        );
    }
}
