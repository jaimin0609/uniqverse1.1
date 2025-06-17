import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            performance: {
                uptime: process.uptime(),
                memory: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024),
                }, cpu: {
                    loadAverage: process.platform !== 'win32' ? (process as any).loadavg?.() || [0, 0, 0] : [0, 0, 0],
                    platform: process.platform,
                    arch: process.arch,
                }
            },
            environment: {
                nodeVersion: process.version,
                environment: process.env.NODE_ENV,
                platform: process.platform,
            },
            application: {
                version: process.env.npm_package_version || '1.0.0',
                buildTime: process.env.BUILD_TIME || 'unknown',
                gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
            }
        };

        return NextResponse.json(metrics, { status: 200 });
    } catch (error) {
        console.error('Metrics collection failed:', error);

        return NextResponse.json(
            {
                error: 'Failed to collect metrics',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
