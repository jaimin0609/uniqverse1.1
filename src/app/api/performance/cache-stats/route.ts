import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

export async function GET(request: NextRequest) {
    try {
        // Get enhanced cache statistics
        const cacheStats = cache.getEnhancedStats();

        return NextResponse.json({
            success: true,
            performance: cacheStats.performance,
            memoryCacheSize: cacheStats.memoryCacheSize,
            hotKeys: cacheStats.hotKeys
        });
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve cache statistics',
                performance: {
                    hitRate: 0,
                    missRate: 0,
                    totalRequests: 0,
                    totalHits: 0,
                    totalMisses: 0,
                    memorySize: 0,
                    efficiency: 'poor'
                }
            },
            { status: 500 }
        );
    }
}
