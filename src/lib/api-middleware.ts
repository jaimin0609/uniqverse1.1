import { NextRequest, NextResponse } from 'next/server';
import { performanceOptimizer } from './performance-optimizer';
import { monitor } from './production-monitor';
import { security, rateLimitConfigs } from './security-manager';
import { cache } from './cache-manager';

/**
 * Optimized API Middleware
 * Integrates performance monitoring, security, rate limiting, and caching
 */

export interface APIMiddlewareConfig {
    enableRateLimit?: boolean;
    rateLimitConfig?: 'strict' | 'moderate' | 'lenient' | 'api' | 'auth' | any;
    enableSecurity?: boolean;
    enableCaching?: boolean;
    cacheTTL?: number;
    enableCompression?: boolean;
    enableMetrics?: boolean;
    requireAuth?: boolean;
    allowedMethods?: string[];
    maxRequestSize?: number;
}

export interface APIResponse {
    data?: any;
    error?: string;
    success: boolean;
    metadata?: {
        timestamp: string;
        requestId: string;
        cached?: boolean;
        processingTime?: number;
        rateLimit?: {
            limit: number;
            remaining: number;
            reset: string;
        };
    };
}

/**
 * Create optimized API route handler
 */
export function createOptimizedAPIHandler(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response | any>,
    config: APIMiddlewareConfig = {}
) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // 1. Method validation
            if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
                return createErrorResponse(
                    'Method not allowed',
                    405,
                    requestId,
                    Date.now() - startTime
                );
            }

            // 2. Security validation
            if (config.enableSecurity !== false) {
                const securityResult = await security.validateRequest(request);
                if (!securityResult.valid) {
                    monitor.log('warn', `Security validation failed: ${securityResult.reason}`, { url: request.url }, undefined, requestId);
                    return createErrorResponse(
                        'Access denied',
                        403,
                        requestId,
                        Date.now() - startTime
                    );
                }
            }

            // 3. Rate limiting
            if (config.enableRateLimit !== false) {
                const rateLimitConfig = typeof config.rateLimitConfig === 'string'
                    ? rateLimitConfigs[config.rateLimitConfig as keyof typeof rateLimitConfigs]
                    : (config.rateLimitConfig || rateLimitConfigs.moderate);

                const rateLimiter = security.createRateLimiter(rateLimitConfig);
                const rateLimitResult = await rateLimiter(request);

                if (rateLimitResult instanceof NextResponse) {
                    return rateLimitResult; // Rate limit exceeded
                }
            }

            // 4. Request size validation
            if (config.maxRequestSize) {
                const contentLength = parseInt(request.headers.get('content-length') || '0');
                if (contentLength > config.maxRequestSize) {
                    return createErrorResponse(
                        'Request too large',
                        413,
                        requestId,
                        Date.now() - startTime
                    );
                }
            }

            // 5. Input validation and sanitization
            const sanitizedRequest = await sanitizeRequest(request);

            // 6. Caching (for GET requests)
            let cacheKey: string | null = null;
            let cachedResponse: any = null;

            if (config.enableCaching !== false && request.method === 'GET') {
                cacheKey = generateCacheKey(request);
                cachedResponse = await cache.get(cacheKey);

                if (cachedResponse) {
                    monitor.recordMetric('cache_hit', 1, 'count', { endpoint: request.url });
                    return createSuccessResponse(
                        cachedResponse,
                        requestId,
                        Date.now() - startTime,
                        true
                    );
                }
            }

            // 7. Execute handler with performance monitoring
            const result = await performanceOptimizer.executeQuery(
                () => handler(sanitizedRequest, context),
                cacheKey || undefined,
                {
                    enableCache: config.enableCaching !== false && request.method === 'GET',
                    cacheTTL: config.cacheTTL,
                    timeout: 30000
                }
            );

            // 8. Process response
            let responseData;
            let statusCode = 200;

            if (result instanceof NextResponse || result instanceof Response) {
                // Handler returned a Response object
                const responseClone = result.clone();
                const responseText = await responseClone.text();

                try {
                    responseData = JSON.parse(responseText);
                } catch {
                    responseData = responseText;
                }

                statusCode = result.status;
            } else {
                // Handler returned data
                responseData = result;
            }

            // 9. Cache successful responses
            if (config.enableCaching !== false &&
                request.method === 'GET' &&
                cacheKey &&
                statusCode < 400) {
                await cache.set(cacheKey, responseData, config.cacheTTL || 300);
            }

            // 10. Record metrics
            if (config.enableMetrics !== false) {
                const processingTime = Date.now() - startTime;
                monitor.recordMetric('api_response_time', processingTime, 'ms', {
                    endpoint: request.url,
                    method: request.method,
                    statusCode
                });

                monitor.recordMetric('api_request_count', 1, 'count', {
                    endpoint: request.url,
                    method: request.method,
                    statusCode
                });
            }

            // 11. Create optimized response
            const response = createSuccessResponse(
                responseData,
                requestId,
                Date.now() - startTime,
                false
            );

            // 12. Add security headers
            return security.addSecurityHeaders(response);

        } catch (error) {
            const processingTime = Date.now() - startTime;

            // Log error
            monitor.reportError(
                error as Error,
                {
                    url: request.url,
                    method: request.method,
                    requestId,
                    processingTime
                },
                'high',
                undefined,
                requestId
            );

            // Record error metrics
            monitor.recordMetric('api_error_count', 1, 'count', {
                endpoint: request.url,
                method: request.method,
                error: (error as Error).message
            });

            return createErrorResponse(
                'Internal server error',
                500,
                requestId,
                processingTime,
                process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            );
        }
    };
}

/**
 * Create optimized database query middleware
 */
export function createDBQueryMiddleware() {
    return async <T>(queryFn: () => Promise<T>, cacheKey?: string, options?: any) => {
        return performanceOptimizer.executeQuery(queryFn, cacheKey, options);
    };
}

/**
 * Create batch processing middleware
 */
export function createBatchProcessor<T, R>(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10
) {
    return async (items: T[]): Promise<R[]> => {
        const results: R[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processor(batch);
            results.push(...batchResults);

            // Add small delay between batches to prevent overwhelming the system
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        return results;
    };
}

/**
 * Generate cache key for request
 */
function generateCacheKey(request: NextRequest): string {
    const url = new URL(request.url);
    const params = Array.from(url.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    const authHeader = request.headers.get('authorization');
    const userId = authHeader ? `user_${authHeader.slice(-8)}` : 'anonymous';

    return `api:${url.pathname}:${params}:${userId}`;
}

/**
 * Sanitize request to prevent XSS and injection attacks
 */
async function sanitizeRequest(request: NextRequest): Promise<NextRequest> {
    // Clone the request
    const clonedRequest = request.clone();

    // Sanitize query parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams.entries()) {
        if (security.detectXSS(value) || security.detectSQLInjection(value)) {
            url.searchParams.delete(key);
            monitor.log('warn', `Malicious parameter detected and removed: ${key}=${value}`);
        }
    }

    // For POST/PUT requests, sanitize body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
            const body = await clonedRequest.text();

            if (body) {
                const parsedBody = JSON.parse(body);
                const sanitizedBody = sanitizeObject(parsedBody);

                // Create new request with sanitized body
                return new NextRequest(url, {
                    method: request.method,
                    headers: request.headers,
                    body: JSON.stringify(sanitizedBody)
                });
            }
        } catch (error) {
            // If body parsing fails, return original request
            monitor.log('warn', 'Failed to parse request body for sanitization', error);
        }
    }

    return new NextRequest(url, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        if (security.detectXSS(obj) || security.detectSQLInjection(obj)) {
            monitor.log('warn', `Malicious content detected and sanitized: ${obj.substring(0, 100)}`);
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}

/**
 * Create success response
 */
function createSuccessResponse(
    data: any,
    requestId: string,
    processingTime: number,
    cached: boolean = false
): NextResponse {
    const response: APIResponse = {
        data,
        success: true,
        metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            cached,
            processingTime
        }
    };

    return NextResponse.json(response, {
        headers: {
            'X-Request-ID': requestId,
            'X-Processing-Time': `${processingTime}ms`,
            'X-Cached': cached.toString(),
            'Cache-Control': cached ? 'public, max-age=300' : 'no-cache'
        }
    });
}

/**
 * Create error response
 */
function createErrorResponse(
    message: string,
    statusCode: number,
    requestId: string,
    processingTime: number,
    stack?: string
): NextResponse {
    const response: APIResponse = {
        error: message,
        success: false,
        metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            processingTime
        }
    };

    if (stack && process.env.NODE_ENV === 'development') {
        (response as any).stack = stack;
    }

    return NextResponse.json(response, {
        status: statusCode,
        headers: {
            'X-Request-ID': requestId,
            'X-Processing-Time': `${processingTime}ms`
        }
    });
}

/**
 * Create WebSocket optimizations
 */
export function createWebSocketOptimizations() {
    const connections = new Map<string, any>();
    const messageQueue = new Map<string, any[]>();

    return {
        addConnection: (id: string, connection: any) => {
            connections.set(id, connection);
            messageQueue.set(id, []);
        },

        removeConnection: (id: string) => {
            connections.delete(id);
            messageQueue.delete(id);
        },

        broadcast: (message: any, targetIds?: string[]) => {
            const targets = targetIds || Array.from(connections.keys());

            targets.forEach(id => {
                const connection = connections.get(id);
                if (connection) {
                    try {
                        connection.send(JSON.stringify(message));
                    } catch (error) {
                        monitor.reportError(error as Error, { connectionId: id }, 'low');
                    }
                }
            });
        },

        queueMessage: (connectionId: string, message: any) => {
            const queue = messageQueue.get(connectionId) || [];
            queue.push(message);
            messageQueue.set(connectionId, queue);

            // Limit queue size
            if (queue.length > 100) {
                queue.shift();
            }
        },

        flushQueue: (connectionId: string) => {
            const queue = messageQueue.get(connectionId) || [];
            const connection = connections.get(connectionId);

            if (connection && queue.length > 0) {
                queue.forEach(message => {
                    try {
                        connection.send(JSON.stringify(message));
                    } catch (error) {
                        monitor.reportError(error as Error, { connectionId }, 'low');
                    }
                });

                messageQueue.set(connectionId, []);
            }
        }
    };
}

/**
 * Create API health check endpoint
 */
export function createHealthCheckHandler() {
    return createOptimizedAPIHandler(
        async () => {
            const health = await monitor.getHealthMetrics();
            const performanceReport = performanceOptimizer.getPerformanceReport();
            const securityStats = security.getSecurityStats();

            return {
                status: health.status,
                timestamp: new Date().toISOString(),
                uptime: health.uptime,
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'unknown',
                health,
                performance: performanceReport,
                security: securityStats
            };
        },
        {
            enableRateLimit: false,
            enableCaching: false,
            allowedMethods: ['GET']
        }
    );
}

/**
 * Create metrics endpoint
 */
export function createMetricsHandler() {
    return createOptimizedAPIHandler(
        async (request: NextRequest) => {
            const url = new URL(request.url);
            const timeRange = url.searchParams.get('range') as '1h' | '24h' | '7d' || '24h';

            const analytics = monitor.getPerformanceAnalytics(timeRange);
            const performanceReport = performanceOptimizer.getPerformanceReport();

            return {
                timeRange,
                analytics,
                performance: performanceReport
            };
        },
        {
            enableRateLimit: true,
            rateLimitConfig: 'moderate',
            enableCaching: true,
            cacheTTL: 60, // 1 minute cache
            allowedMethods: ['GET']
        }
    );
}
