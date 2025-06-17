import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Check database connectivity
        await db.$queryRaw`SELECT 1`;        // Check Redis connectivity (if available)
        let redisStatus = 'unavailable';
        try {
            const { redis } = await import('@/lib/redis');
            const isAvailable = await redis.isAvailable();
            redisStatus = isAvailable ? 'connected' : 'disconnected';
        } catch (error) {
            redisStatus = 'disconnected';
        }

        // System health checks
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: 'connected',
                redis: redisStatus,
            },
            system: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                },
                node_version: process.version,
            }
        };

        return NextResponse.json(health, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed',
                services: {
                    database: 'disconnected',
                    redis: 'unknown',
                }
            },
            { status: 503 }
        );
    }
}
