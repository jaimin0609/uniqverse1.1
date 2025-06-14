// Performance monitoring utilities for API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

interface PerformanceMetrics {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    cacheHit?: boolean;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics[] = [];
    private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public startTimer(endpoint: string, method: string, request?: NextRequest) {
        const startTime = Date.now();

        return {
            end: (response: NextResponse, cacheHit = false) => {
                const duration = Date.now() - startTime;
                const metric: PerformanceMetrics = {
                    endpoint,
                    method,
                    duration,
                    statusCode: response.status,
                    cacheHit, timestamp: new Date(),
                    userAgent: request?.headers.get('user-agent') || undefined,
                    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown'
                };

                this.recordMetric(metric);

                // Log slow requests
                if (duration > 1000) {
                    console.warn(`🐌 Slow request detected: ${endpoint} took ${duration}ms`);
                }

                return response;
            }
        };
    }

    private recordMetric(metric: PerformanceMetrics) {
        this.metrics.push(metric);

        // Keep only last MAX_METRICS entries
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Store in cache for persistence
        this.persistMetrics();
    }

    private async persistMetrics() {
        try {
            const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
            await cache.set('performance:recent_metrics', recentMetrics, 3600); // 1 hour TTL
        } catch (error) {
            console.error('Failed to persist performance metrics:', error);
        }
    }

    public getMetrics(hours = 1): PerformanceMetrics[] {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.metrics.filter(m => m.timestamp >= since);
    }

    public async getAggregatedStats(hours = 1) {
        const metrics = this.getMetrics(hours);

        if (metrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                cacheHitRate: 0,
                errorRate: 0,
                slowRequests: 0,
                endpointStats: {}
            };
        }

        const totalRequests = metrics.length;
        const averageResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
        const cacheHits = metrics.filter(m => m.cacheHit).length;
        const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
        const errors = metrics.filter(m => m.statusCode >= 400).length;
        const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
        const slowRequests = metrics.filter(m => m.duration > 1000).length;

        // Group by endpoint
        const endpointStats: Record<string, any> = {};
        metrics.forEach(metric => {
            if (!endpointStats[metric.endpoint]) {
                endpointStats[metric.endpoint] = {
                    count: 0,
                    totalDuration: 0,
                    errors: 0,
                    cacheHits: 0
                };
            }

            const stats = endpointStats[metric.endpoint];
            stats.count++;
            stats.totalDuration += metric.duration;
            if (metric.statusCode >= 400) stats.errors++;
            if (metric.cacheHit) stats.cacheHits++;
        });

        // Calculate averages for each endpoint
        Object.keys(endpointStats).forEach(endpoint => {
            const stats = endpointStats[endpoint];
            stats.averageResponseTime = stats.totalDuration / stats.count;
            stats.errorRate = (stats.errors / stats.count) * 100;
            stats.cacheHitRate = (stats.cacheHits / stats.count) * 100;
        });

        return {
            totalRequests,
            averageResponseTime: Math.round(averageResponseTime),
            cacheHitRate: Math.round(cacheHitRate * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            slowRequests,
            endpointStats
        };
    }

    public async getSlowEndpoints(limit = 10) {
        const stats = await this.getAggregatedStats(24); // Last 24 hours

        return Object.entries(stats.endpointStats)
            .map(([endpoint, stats]: [string, any]) => ({
                endpoint,
                averageResponseTime: stats.averageResponseTime,
                requestCount: stats.count,
                errorRate: stats.errorRate
            }))
            .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
            .slice(0, limit);
    }

    public async getCachePerformance() {
        const stats = await this.getAggregatedStats(1);
        const redisAvailable = await cache.isAvailable();

        return {
            hitRate: stats.cacheHitRate,
            isRedisAvailable: redisAvailable,
            totalRequests: stats.totalRequests,
            recommendations: this.getCacheRecommendations(stats.cacheHitRate)
        };
    } private getCacheRecommendations(hitRate: number): string[] {
        const recommendations: string[] = [];

        if (hitRate < 50) {
            recommendations.push('Very low cache hit rate - consider increasing TTL values');
            recommendations.push('Review caching strategy for frequently accessed endpoints');
        } else if (hitRate < 70) {
            recommendations.push('Cache hit rate could be improved - analyze cache patterns');
            recommendations.push('Consider pre-warming cache for popular content');
        } else if (hitRate < 85) {
            recommendations.push('Good cache performance - consider fine-tuning TTL values');
        }

        return recommendations;
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Middleware wrapper for automatic performance monitoring
export function withPerformanceMonitoring(
    handler: (req: NextRequest) => Promise<NextResponse>,
    endpoint: string
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const timer = performanceMonitor.startTimer(endpoint, req.method || 'GET', req);

        try {
            const response = await handler(req);
            return timer.end(response, false); // Will be set to true if cache hit detected
        } catch (error) {
            const errorResponse = NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
            return timer.end(errorResponse, false);
        }
    };
}

// Cache hit detection wrapper
export function withCacheHitDetection(
    response: NextResponse,
    wasCacheHit: boolean
): NextResponse {
    // Add cache status header for debugging
    response.headers.set('X-Cache-Status', wasCacheHit ? 'HIT' : 'MISS');
    return response;
}
