import { NextRequest, NextResponse } from 'next/server';
import { cache } from './cache-manager';
import { monitor } from './production-monitor';

/**
 * Production Security and Rate Limiting System
 * Provides DDoS protection, rate limiting, and security monitoring
 */

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: NextRequest) => string;
    onLimitReached?: (request: NextRequest) => void;
}

export interface SecurityConfig {
    enableCORS?: boolean;
    enableCSRF?: boolean;
    enableXSSProtection?: boolean;
    enableContentTypeSniffing?: boolean;
    enableReferrerPolicy?: boolean;
    maxRequestSize?: number;
    allowedOrigins?: string[];
    blockedUserAgents?: string[];
    blockedIPs?: string[];
}

export interface SecurityEvent {
    type: 'rate_limit' | 'blocked_ip' | 'suspicious_activity' | 'csrf_violation' | 'xss_attempt';
    ip: string;
    userAgent: string;
    url: string;
    timestamp: Date;
    metadata?: any;
}

class SecurityManager {
    private securityEvents: SecurityEvent[] = [];
    private blockedIPs = new Set<string>();
    private suspiciousIPs = new Map<string, number>();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private defaultConfig: SecurityConfig = {
        enableCORS: true,
        enableCSRF: true,
        enableXSSProtection: true,
        enableContentTypeSniffing: false,
        enableReferrerPolicy: true,
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedOrigins: [],
        blockedUserAgents: [
            'bot', 'crawler', 'spider', 'scraper'
        ],
        blockedIPs: []
    };

    constructor() {
        this.setupCleanupJob();
    }

    /**
     * Rate limiting middleware
     */
    createRateLimiter(config: RateLimitConfig) {
        return async (request: NextRequest) => {
            const key = config.keyGenerator
                ? config.keyGenerator(request)
                : this.getClientIdentifier(request);

            const cacheKey = `rate_limit:${key}`;

            try {
                // Get current count
                const current = await cache.get(cacheKey) as number || 0;

                if (current >= config.maxRequests) {
                    // Rate limit exceeded
                    this.recordSecurityEvent('rate_limit', request, {
                        requests: current,
                        limit: config.maxRequests
                    });

                    if (config.onLimitReached) {
                        config.onLimitReached(request);
                    }

                    // Temporarily block IP if excessive rate limiting
                    this.handleExcessiveRateLimit(key);

                    return new NextResponse(
                        JSON.stringify({ error: 'Rate limit exceeded' }),
                        {
                            status: 429,
                            headers: {
                                'Content-Type': 'application/json',
                                'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
                                'X-RateLimit-Limit': config.maxRequests.toString(),
                                'X-RateLimit-Remaining': '0',
                                'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
                            }
                        }
                    );
                }

                // Increment counter
                await cache.set(cacheKey, current + 1, Math.ceil(config.windowMs / 1000));

                // Add rate limit headers
                const remaining = Math.max(0, config.maxRequests - (current + 1));

                return {
                    headers: {
                        'X-RateLimit-Limit': config.maxRequests.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
                    }
                };
            } catch (error) {
                monitor.reportError(error as Error, { context: 'rate_limiting', key }, 'high');
                return null; // Allow request to proceed on cache failure
            }
        };
    }

    /**
     * Security headers middleware
     */
    addSecurityHeaders(response: NextResponse, config: SecurityConfig = {}) {
        const fullConfig = { ...this.defaultConfig, ...config };

        // CORS headers
        if (fullConfig.enableCORS) {
            const origin = fullConfig.allowedOrigins && fullConfig.allowedOrigins.length > 0
                ? fullConfig.allowedOrigins.join(', ')
                : '*';

            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Max-Age', '86400');
        }

        // XSS Protection
        if (fullConfig.enableXSSProtection) {
            response.headers.set('X-XSS-Protection', '1; mode=block');
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');
        }

        // Content Security Policy
        response.headers.set('Content-Security-Policy', this.generateCSP());

        // Strict Transport Security
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Referrer Policy
        if (fullConfig.enableReferrerPolicy) {
            response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        // Permissions Policy
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return response;
    }

    /**
     * Request validation middleware
     */
    validateRequest(request: NextRequest, config: SecurityConfig = {}): { valid: boolean; reason?: string } {
        const fullConfig = { ...this.defaultConfig, ...config };
        const ip = this.getClientIP(request);
        const userAgent = request.headers.get('user-agent') || '';

        // Check blocked IPs
        if (this.blockedIPs.has(ip) || fullConfig.blockedIPs?.includes(ip)) {
            this.recordSecurityEvent('blocked_ip', request);
            return { valid: false, reason: 'Blocked IP address' };
        }

        // Check blocked user agents
        const isBlockedAgent = fullConfig.blockedUserAgents?.some(agent =>
            userAgent.toLowerCase().includes(agent.toLowerCase())
        );

        if (isBlockedAgent) {
            this.recordSecurityEvent('suspicious_activity', request, { reason: 'blocked_user_agent' });
            return { valid: false, reason: 'Blocked user agent' };
        }

        // Check request size
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > (fullConfig.maxRequestSize || 10 * 1024 * 1024)) {
            return { valid: false, reason: 'Request too large' };
        }

        // Check for suspicious patterns
        if (this.detectSuspiciousActivity(request)) {
            this.recordSecurityEvent('suspicious_activity', request);
            return { valid: false, reason: 'Suspicious activity detected' };
        }

        return { valid: true };
    }

    /**
     * CSRF protection
     */
    async validateCSRFToken(request: NextRequest, token: string): Promise<boolean> {
        if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
            return true; // CSRF protection not needed for safe methods
        }

        const sessionId = this.getSessionId(request);
        if (!sessionId) {
            return false;
        }

        const expectedToken = await cache.get(`csrf:${sessionId}`);
        return expectedToken === token;
    }

    /**
     * Generate CSRF token
     */
    async generateCSRFToken(sessionId: string): Promise<string> {
        const token = this.generateSecureToken();
        await cache.set(`csrf:${sessionId}`, token, 3600); // 1 hour
        return token;
    }

    /**
     * SQL injection detection
     */
    detectSQLInjection(input: string): boolean {
        const sqlPatterns = [
            /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
            /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
            /['";]\s*(\bOR\b|\bAND\b)/i,
            /\b(EXEC|EXECUTE)\s*\(/i,
            /\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * XSS detection
     */
    detectXSS(input: string): boolean {
        const xssPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/i,
            /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<.*?(\bon\w+|javascript:|data:).*?>/i,
            /(<|&lt;)(script|iframe|object|embed|form)/i
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Block IP address temporarily
     */
    blockIP(ip: string, duration: number = 24 * 60 * 60 * 1000) { // 24 hours default
        this.blockedIPs.add(ip);

        // Remove block after duration
        setTimeout(() => {
            this.blockedIPs.delete(ip);
        }, duration);

        monitor.log('warn', `IP blocked: ${ip}`, { duration });
    }

    /**
     * Get security events
     */
    getSecurityEvents(limit: number = 100): SecurityEvent[] {
        return this.securityEvents.slice(-limit);
    }

    /**
     * Get security statistics
     */
    getSecurityStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        blockedIPs: number;
        suspiciousIPs: number;
        recentEvents: SecurityEvent[];
    } {
        const eventsByType = this.securityEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const recentEvents = this.securityEvents
            .filter(event => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000) // Last hour
            .slice(-20);

        return {
            totalEvents: this.securityEvents.length,
            eventsByType,
            blockedIPs: this.blockedIPs.size,
            suspiciousIPs: this.suspiciousIPs.size,
            recentEvents
        };
    }

    /**
     * Generate Content Security Policy
     */
    private generateCSP(): string {
        const policies = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https:",
            "object-src 'none'",
            "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
            "connect-src 'self' https://api.stripe.com",
            "base-uri 'self'",
            "form-action 'self'"
        ];

        return policies.join('; ');
    }

    /**
     * Get client identifier for rate limiting
     */
    private getClientIdentifier(request: NextRequest): string {
        const ip = this.getClientIP(request);
        const userAgent = request.headers.get('user-agent') || '';

        // Create a hash of IP + User Agent for more accurate rate limiting
        const crypto = require('crypto');
        return crypto
            .createHash('sha256')
            .update(`${ip}:${userAgent}`)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Get client IP address
     */
    private getClientIP(request: NextRequest): string {
        const forwarded = request.headers.get('x-forwarded-for');
        const realIP = request.headers.get('x-real-ip');
        const cloudflareIP = request.headers.get('cf-connecting-ip');

        return cloudflareIP || realIP || forwarded?.split(',')[0] || 'unknown';
    }

    /**
     * Get session ID from request
     */
    private getSessionId(request: NextRequest): string | null {
        const authHeader = request.headers.get('authorization');
        const sessionCookie = request.cookies.get('session')?.value;

        return authHeader?.replace('Bearer ', '') || sessionCookie || null;
    }

    /**
     * Generate secure token
     */
    private generateSecureToken(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Detect suspicious activity
     */
    private detectSuspiciousActivity(request: NextRequest): boolean {
        const url = request.url;
        const userAgent = request.headers.get('user-agent') || '';

        // Check for common attack patterns in URL
        const suspiciousPatterns = [
            /\.\.\/\.\.\//,  // Directory traversal
            /\/\.\./,        // Directory traversal
            /\bwp-admin\b/,  // WordPress admin attempts
            /\bphpmyadmin\b/, // phpMyAdmin attempts
            /\b(eval|base64_decode|exec|system)\b/i, // Code execution attempts
            /\b(script|alert|prompt|confirm)\b/i,    // XSS attempts
            /<.*?>/,         // HTML tags
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(url))) {
            return true;
        }

        // Check for suspicious user agents
        const suspiciousUserAgents = [
            /curl/i,
            /wget/i,
            /python/i,
            /bot/i,
            /scanner/i,
            /test/i
        ];

        if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
            return true;
        }

        return false;
    }

    /**
     * Handle excessive rate limiting
     */
    private handleExcessiveRateLimit(clientId: string) {
        const ip = clientId.split(':')[0];
        const suspiciousCount = this.suspiciousIPs.get(ip) || 0;

        this.suspiciousIPs.set(ip, suspiciousCount + 1);

        // Block IP if too many rate limit violations
        if (suspiciousCount >= 10) {
            this.blockIP(ip);
            monitor.log('warn', `IP blocked due to excessive rate limiting: ${ip}`);
        }
    }

    /**
     * Record security event
     */
    private recordSecurityEvent(
        type: SecurityEvent['type'],
        request: NextRequest,
        metadata?: any
    ) {
        const event: SecurityEvent = {
            type,
            ip: this.getClientIP(request),
            userAgent: request.headers.get('user-agent') || '',
            url: request.url,
            timestamp: new Date(),
            metadata
        };

        this.securityEvents.push(event);

        // Keep only last 10000 events
        if (this.securityEvents.length > 10000) {
            this.securityEvents = this.securityEvents.slice(-10000);
        }

        // Log high severity events
        if (['blocked_ip', 'suspicious_activity'].includes(type)) {
            monitor.log('warn', `Security event: ${type}`, event);
        }
    }    /**
     * Setup cleanup job
     */    private setupCleanupJob() {
        // Only setup cleanup in server environment to prevent memory leaks
        if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
            // Clean up old events every hour
            this.cleanupInterval = setInterval(() => {
                try {
                    const oneHourAgo = Date.now() - 60 * 60 * 1000;
                    this.securityEvents = this.securityEvents.filter(
                        event => event.timestamp.getTime() > oneHourAgo
                    );

                    // Reset suspicious IP counts
                    this.suspiciousIPs.clear();
                } catch (error) {
                    console.warn('Security cleanup failed:', error);
                }
            }, 60 * 60 * 1000);
        }
    }

    /**
     * Cleanup security manager resources
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.securityEvents = [];
        this.blockedIPs.clear();
        this.suspiciousIPs.clear();
    }
}

export const security = new SecurityManager();

// Common rate limit configurations
export const rateLimitConfigs = {
    strict: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
    },
    moderate: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000
    },
    lenient: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5000
    },
    api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60
    },
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5
    }
};

// Utility functions for middleware
export function createSecurityMiddleware(config?: SecurityConfig) {
    return async (request: NextRequest) => {
        // Validate request
        const validation = security.validateRequest(request, config);
        if (!validation.valid) {
            return new NextResponse(
                JSON.stringify({ error: validation.reason }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return null; // Allow request to proceed
    };
}
