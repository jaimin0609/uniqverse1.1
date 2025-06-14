import { db } from './db';
import { cache } from './cache-manager';

/**
 * Production Monitoring and Logging System
 * Provides real-time performance monitoring, error tracking, and alerting
 */

export interface LogEntry {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    metadata?: any;
    timestamp: Date;
    userId?: string;
    requestId?: string;
    source: string;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    metadata?: any;
}

export interface ErrorReport {
    error: string;
    stack?: string;
    context: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    userId?: string;
    requestId?: string;
}

export interface AlertRule {
    id: string;
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    window: number; // Time window in minutes
    enabled: boolean;
}

class ProductionMonitor {
    private logs: LogEntry[] = [];
    private metrics: PerformanceMetric[] = [];
    private errors: ErrorReport[] = [];
    private alertRules: AlertRule[] = [];
    private maxLogSize = 10000;
    private maxMetricSize = 5000;
    private maxErrorSize = 1000;

    constructor() {
        this.initializeDefaultAlerts();
        this.setupCleanupJob();
    }

    /**
     * Log message with metadata
     */
    log(level: LogEntry['level'], message: string, metadata?: any, userId?: string, requestId?: string) {
        const entry: LogEntry = {
            level,
            message,
            metadata,
            timestamp: new Date(),
            userId,
            requestId,
            source: this.getCallerInfo()
        };

        this.logs.push(entry);
        this.trimLogs();

        // Console output for development
        if (process.env.NODE_ENV === 'development') {
            console[level](`[${entry.timestamp.toISOString()}] ${message}`, metadata);
        }

        // Store critical errors in database
        if (level === 'error') {
            this.persistError(entry);
        }

        // Check for alert conditions
        this.checkAlerts(entry);
    }

    /**
     * Record performance metric
     */
    recordMetric(name: string, value: number, unit: string = 'ms', metadata?: any) {
        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: new Date(),
            metadata
        };

        this.metrics.push(metric);
        this.trimMetrics();

        // Store in database for analytics
        this.persistMetric(metric);

        // Check performance thresholds
        this.checkPerformanceThresholds(metric);
    }

    /**
     * Report error
     */
    reportError(error: Error | string, context: any = {}, severity: ErrorReport['severity'] = 'medium', userId?: string, requestId?: string) {
        const errorReport: ErrorReport = {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            context,
            severity,
            timestamp: new Date(),
            userId,
            requestId
        };

        this.errors.push(errorReport);
        this.trimErrors();

        // Log the error
        this.log('error', errorReport.error, { ...context, stack: errorReport.stack }, userId, requestId);

        // Send alerts for critical errors
        if (severity === 'critical') {
            this.sendAlert(`Critical Error: ${errorReport.error}`, errorReport);
        }
    }

    /**
     * Get system health metrics
     */
    async getHealthMetrics(): Promise<{
        status: 'healthy' | 'degraded' | 'critical';
        uptime: number;
        memory: any;
        database: any;
        cache: any;
        errors: any;
        performance: any;
    }> {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        // Recent errors
        const recentErrors = this.errors.filter(e => e.timestamp.getTime() > oneHourAgo);
        const criticalErrors = recentErrors.filter(e => e.severity === 'critical');

        // Recent metrics
        const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

        // Database health
        const dbHealth = await this.checkDatabaseHealth();

        // Cache health
        const cacheHealth = await this.checkCacheHealth();

        // Memory usage
        const memoryUsage = process.memoryUsage();

        // Performance metrics
        const avgResponseTime = this.calculateAverageResponseTime();

        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (criticalErrors.length > 0 || !dbHealth.connected || avgResponseTime > 5000) {
            status = 'critical';
        } else if (recentErrors.length > 10 || avgResponseTime > 2000 || !cacheHealth.connected) {
            status = 'degraded';
        }

        return {
            status,
            uptime: process.uptime(),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024)
            },
            database: dbHealth,
            cache: cacheHealth,
            errors: {
                total: recentErrors.length,
                critical: criticalErrors.length,
                byLevel: this.groupErrorsByLevel(recentErrors)
            },
            performance: {
                averageResponseTime: avgResponseTime,
                totalRequests: recentMetrics.filter(m => m.name === 'request_duration').length,
                slowQueries: recentMetrics.filter(m => m.name === 'db_query_duration' && m.value > 1000).length
            }
        };
    }

    /**
     * Get performance analytics
     */
    getPerformanceAnalytics(timeRange: '1h' | '24h' | '7d' = '24h'): {
        responseTime: Array<{ timestamp: string; value: number }>;
        errorRate: Array<{ timestamp: string; value: number }>;
        throughput: Array<{ timestamp: string; value: number }>;
        topErrors: Array<{ error: string; count: number }>;
    } {
        const now = Date.now();
        let startTime: number;

        switch (timeRange) {
            case '1h':
                startTime = now - 60 * 60 * 1000;
                break;
            case '24h':
                startTime = now - 24 * 60 * 60 * 1000;
                break;
            case '7d':
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
        }

        const relevantMetrics = this.metrics.filter(m => m.timestamp.getTime() > startTime);
        const relevantErrors = this.errors.filter(e => e.timestamp.getTime() > startTime);
        const relevantLogs = this.logs.filter(l => l.timestamp.getTime() > startTime);

        return {
            responseTime: this.aggregateMetricsByTime(
                relevantMetrics.filter(m => m.name === 'request_duration'),
                timeRange
            ),
            errorRate: this.aggregateErrorsByTime(relevantErrors, timeRange),
            throughput: this.aggregateThroughputByTime(relevantLogs, timeRange),
            topErrors: this.getTopErrors(relevantErrors)
        };
    }

    /**
     * Create custom alert rule
     */
    addAlertRule(rule: Omit<AlertRule, 'id'>): string {
        const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.alertRules.push({ ...rule, id });
        return id;
    }

    /**
     * Remove alert rule
     */
    removeAlertRule(id: string): boolean {
        const index = this.alertRules.findIndex(rule => rule.id === id);
        if (index > -1) {
            this.alertRules.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get all alert rules
     */
    getAlertRules(): AlertRule[] {
        return [...this.alertRules];
    }

    /**
     * Initialize default alert rules
     */
    private initializeDefaultAlerts() {
        this.alertRules = [
            {
                id: 'high_response_time',
                name: 'High Response Time',
                metric: 'request_duration',
                condition: 'gt',
                threshold: 5000,
                window: 5,
                enabled: true
            },
            {
                id: 'high_error_rate',
                name: 'High Error Rate',
                metric: 'error_count',
                condition: 'gt',
                threshold: 10,
                window: 5,
                enabled: true
            },
            {
                id: 'slow_db_queries',
                name: 'Slow Database Queries',
                metric: 'db_query_duration',
                condition: 'gt',
                threshold: 2000,
                window: 5,
                enabled: true
            },
            {
                id: 'memory_usage',
                name: 'High Memory Usage',
                metric: 'memory_usage_mb',
                condition: 'gt',
                threshold: 512,
                window: 10,
                enabled: true
            }
        ];
    }

    /**
     * Check alert conditions
     */
    private checkAlerts(entry: LogEntry) {
        if (entry.level === 'error') {
            // Check error rate alerts
            const recentErrors = this.errors.filter(
                e => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000
            );

            const errorRateRule = this.alertRules.find(r => r.metric === 'error_count' && r.enabled);
            if (errorRateRule && recentErrors.length > errorRateRule.threshold) {
                this.sendAlert(
                    `High error rate detected: ${recentErrors.length} errors in ${errorRateRule.window} minutes`,
                    { errorCount: recentErrors.length, threshold: errorRateRule.threshold }
                );
            }
        }
    }

    /**
     * Check performance thresholds
     */
    private checkPerformanceThresholds(metric: PerformanceMetric) {
        const relevantRules = this.alertRules.filter(
            rule => rule.metric === metric.name && rule.enabled
        );

        for (const rule of relevantRules) {
            const shouldAlert = this.evaluateCondition(metric.value, rule.condition, rule.threshold);

            if (shouldAlert) {
                this.sendAlert(
                    `Performance threshold exceeded: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${rule.threshold})`,
                    { metric: metric.name, value: metric.value, threshold: rule.threshold }
                );
            }
        }
    }

    /**
     * Evaluate alert condition
     */
    private evaluateCondition(value: number, condition: AlertRule['condition'], threshold: number): boolean {
        switch (condition) {
            case 'gt':
                return value > threshold;
            case 'lt':
                return value < threshold;
            case 'eq':
                return value === threshold;
            default:
                return false;
        }
    }

    /**
     * Send alert notification
     */
    private async sendAlert(message: string, context: any) {
        console.warn(`🚨 ALERT: ${message}`, context);

        // In production, this would integrate with services like:
        // - Slack webhooks
        // - Email notifications
        // - PagerDuty
        // - Discord webhooks

        try {
            // Store alert in database
            await db.adminAuditLog.create({
                data: {
                    action: 'SYSTEM_ALERT',
                    details: JSON.stringify({ message, context }),
                    createdAt: new Date()
                }
            });
        } catch (error) {
            console.error('Failed to store alert:', error);
        }
    }

    /**
     * Check database health
     */
    private async checkDatabaseHealth(): Promise<{ connected: boolean; responseTime: number; activeConnections?: number }> {
        const start = Date.now();

        try {
            await db.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - start;

            return {
                connected: true,
                responseTime
            };
        } catch (error) {
            return {
                connected: false,
                responseTime: Date.now() - start
            };
        }
    }

    /**
     * Check cache health
     */
    private async checkCacheHealth(): Promise<{ connected: boolean; responseTime: number }> {
        const start = Date.now();

        try {
            await cache.set('health_check', 'ok', 10);
            await cache.get('health_check');
            const responseTime = Date.now() - start;

            return {
                connected: true,
                responseTime
            };
        } catch (error) {
            return {
                connected: false,
                responseTime: Date.now() - start
            };
        }
    }

    /**
     * Calculate average response time
     */
    private calculateAverageResponseTime(): number {
        const recentMetrics = this.metrics.filter(
            m => m.name === 'request_duration' &&
                Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Last hour
        );

        if (recentMetrics.length === 0) return 0;

        const total = recentMetrics.reduce((sum, m) => sum + m.value, 0);
        return Math.round(total / recentMetrics.length);
    }

    /**
     * Group errors by level
     */
    private groupErrorsByLevel(errors: ErrorReport[]): Record<string, number> {
        return errors.reduce((acc, error) => {
            acc[error.severity] = (acc[error.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Aggregate metrics by time
     */
    private aggregateMetricsByTime(
        metrics: PerformanceMetric[],
        timeRange: '1h' | '24h' | '7d'
    ): Array<{ timestamp: string; value: number }> {
        const bucketSize = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes
            timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour
                24 * 60 * 60 * 1000; // 1 day

        const buckets = new Map<number, number[]>();

        metrics.forEach(metric => {
            const bucket = Math.floor(metric.timestamp.getTime() / bucketSize) * bucketSize;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, []);
            }
            buckets.get(bucket)!.push(metric.value);
        });

        return Array.from(buckets.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, values]) => ({
                timestamp: new Date(timestamp).toISOString(),
                value: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
            }));
    }

    /**
     * Aggregate errors by time
     */
    private aggregateErrorsByTime(
        errors: ErrorReport[],
        timeRange: '1h' | '24h' | '7d'
    ): Array<{ timestamp: string; value: number }> {
        const bucketSize = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes
            timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour
                24 * 60 * 60 * 1000; // 1 day

        const buckets = new Map<number, number>();

        errors.forEach(error => {
            const bucket = Math.floor(error.timestamp.getTime() / bucketSize) * bucketSize;
            buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
        });

        return Array.from(buckets.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, count]) => ({
                timestamp: new Date(timestamp).toISOString(),
                value: count
            }));
    }

    /**
     * Aggregate throughput by time
     */
    private aggregateThroughputByTime(
        logs: LogEntry[],
        timeRange: '1h' | '24h' | '7d'
    ): Array<{ timestamp: string; value: number }> {
        const requestLogs = logs.filter(l => l.message.includes('request'));
        return this.aggregateErrorsByTime(
            requestLogs.map(l => ({ ...l, timestamp: l.timestamp, severity: 'low' as const, error: '', context: {} })),
            timeRange
        );
    }

    /**
     * Get top errors
     */
    private getTopErrors(errors: ErrorReport[]): Array<{ error: string; count: number }> {
        const errorCounts = new Map<string, number>();

        errors.forEach(error => {
            const key = error.error;
            errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
        });

        return Array.from(errorCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([error, count]) => ({ error, count }));
    }

    /**
     * Persist error to database
     */
    private async persistError(entry: LogEntry) {
        try {
            await db.adminAuditLog.create({
                data: {
                    action: 'ERROR',
                    details: JSON.stringify({
                        message: entry.message,
                        metadata: entry.metadata,
                        source: entry.source
                    }),
                    performedById: entry.userId,
                    createdAt: entry.timestamp
                }
            });
        } catch (error) {
            console.error('Failed to persist error:', error);
        }
    }

    /**
     * Persist metric to database
     */
    private async persistMetric(metric: PerformanceMetric) {
        try {
            await db.performanceMetric.create({
                data: {
                    id: `${metric.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    metricName: metric.name,
                    metricValue: metric.value,
                    metricUnit: metric.unit,
                    page: metric.metadata?.page || 'system',
                    deviceType: 'DESKTOP', // Default value
                    createdAt: metric.timestamp
                }
            });
        } catch (error) {
            // Silently fail for metrics to avoid performance impact
        }
    }

    /**
     * Get caller information
     */
    private getCallerInfo(): string {
        const stack = new Error().stack;
        if (!stack) return 'unknown';

        const lines = stack.split('\n');
        for (let i = 3; i < lines.length; i++) {
            const line = lines[i];
            if (line && !line.includes('ProductionMonitor') && !line.includes('node_modules')) {
                const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
                if (match) {
                    return `${match[1]} (${match[2].split('/').pop()}:${match[3]})`;
                }
            }
        }
        return 'unknown';
    }

    /**
     * Trim logs to prevent memory issues
     */
    private trimLogs() {
        if (this.logs.length > this.maxLogSize) {
            this.logs = this.logs.slice(-this.maxLogSize);
        }
    }

    /**
     * Trim metrics to prevent memory issues
     */
    private trimMetrics() {
        if (this.metrics.length > this.maxMetricSize) {
            this.metrics = this.metrics.slice(-this.maxMetricSize);
        }
    }

    /**
     * Trim errors to prevent memory issues
     */
    private trimErrors() {
        if (this.errors.length > this.maxErrorSize) {
            this.errors = this.errors.slice(-this.maxErrorSize);
        }
    } private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Setup cleanup job
     */    private setupCleanupJob() {
        // Only setup cleanup in server environment to prevent memory leaks
        if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
            // Clean up old data every hour
            this.cleanupInterval = setInterval(() => {
                try {
                    const oneHourAgo = Date.now() - 60 * 60 * 1000;

                    this.logs = this.logs.filter(l => l.timestamp.getTime() > oneHourAgo);
                    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
                    this.errors = this.errors.filter(e => e.timestamp.getTime() > oneHourAgo);
                } catch (error) {
                    console.warn('Production monitor cleanup failed:', error);
                }
            }, 60 * 60 * 1000);
        }
    }

    /**
     * Cleanup production monitor resources
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.logs = [];
        this.metrics = [];
        this.errors = [];
    }
}

export const monitor = new ProductionMonitor();

// Middleware function for Express/Next.js
export function createMonitoringMiddleware() {
    return (req: any, res: any, next: any) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        // Add request ID to request object
        req.requestId = requestId;

        // Log request start
        monitor.log('info', `Request started: ${req.method} ${req.url}`, {
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        }, req.user?.id, requestId);

        // Override res.end to capture response metrics
        const originalEnd = res.end;
        res.end = function (...args: any[]) {
            const duration = Date.now() - startTime;

            // Record performance metric
            monitor.recordMetric('request_duration', duration, 'ms', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode
            });

            // Log request completion
            monitor.log('info', `Request completed: ${req.method} ${req.url} - ${res.statusCode} in ${duration}ms`, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration
            }, req.user?.id, requestId);

            originalEnd.apply(res, args);
        };

        next();
    };
}
