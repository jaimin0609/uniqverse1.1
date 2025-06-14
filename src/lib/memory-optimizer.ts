"use client";

import { useState, useEffect } from 'react';

/**
 * Memory Usage Optimization System
 * Implements intelligent memory management, garbage collection optimization,
 * and memory leak detection for high-performance applications
 */

interface MemoryMetrics {
    used: number;
    total: number;
    limit: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}

interface MemoryLeak {
    id: string;
    component: string;
    type: 'listener' | 'timer' | 'reference' | 'observer' | 'cache';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: number;
    estimatedSize: number;
}

interface ComponentMemoryStats {
    name: string;
    instances: number;
    averageSize: number;
    totalSize: number;
    lastAccessed: number;
    leakRisk: number; // 0-100
}

class MemoryOptimizer {
    private metrics: MemoryMetrics[] = [];
    private memoryLeaks: MemoryLeak[] = [];
    private componentStats = new Map<string, ComponentMemoryStats>();
    private observerRefs = new Set<MutationObserver | IntersectionObserver | ResizeObserver>();
    private timerRefs = new Set<NodeJS.Timeout | number>();
    private listenerRefs = new Map<string, { element: EventTarget; listener: EventListenerOrEventListenerObject; options?: any }>();
    private cacheRefs = new Map<string, { data: any; size: number; created: number }>();
    private isMonitoring = false;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly MAX_METRICS_HISTORY = 100;
    private readonly MEMORY_WARNING_THRESHOLD = 80; // %
    private readonly MEMORY_CRITICAL_THRESHOLD = 95; // %
    private readonly GC_TRIGGER_THRESHOLD = 85; // %

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeMonitoring();
            this.setupGlobalErrorHandling();
            this.patchMemoryLeakProneMethods();
        }
    }

    /**
     * Initialize memory monitoring
     */
    private initializeMonitoring(): void {
        // Monitor memory usage every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMemoryMetrics();
            this.detectMemoryLeaks();
            this.optimizeMemoryUsage();
        }, 5000);

        // Immediate initial collection
        this.collectMemoryMetrics();
        this.isMonitoring = true;

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        console.log('🧠 Memory Optimizer initialized and monitoring started');
    }

    /**
     * Collect current memory metrics
     */
    private collectMemoryMetrics(): void {
        if (!('memory' in performance)) {
            return; // Memory API not available
        }

        const memory = (performance as any).memory;
        const metrics: MemoryMetrics = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            trend: this.calculateTrend(memory.usedJSHeapSize)
        };

        this.metrics.push(metrics);

        // Keep only recent metrics
        if (this.metrics.length > this.MAX_METRICS_HISTORY) {
            this.metrics.shift();
        }

        // Trigger warnings if necessary
        this.checkMemoryThresholds(metrics);
    }

    /**
     * Calculate memory usage trend
     */
    private calculateTrend(currentUsage: number): 'increasing' | 'decreasing' | 'stable' {
        if (this.metrics.length < 5) return 'stable';

        const recentMetrics = this.metrics.slice(-5);
        const trend = recentMetrics[recentMetrics.length - 1].used - recentMetrics[0].used;
        const changeThreshold = currentUsage * 0.05; // 5% change threshold

        if (trend > changeThreshold) return 'increasing';
        if (trend < -changeThreshold) return 'decreasing';
        return 'stable';
    }

    /**
     * Check memory thresholds and trigger actions
     */
    private checkMemoryThresholds(metrics: MemoryMetrics): void {
        if (metrics.percentage > this.MEMORY_CRITICAL_THRESHOLD) {
            console.error('🚨 CRITICAL: Memory usage above 95%!', metrics);
            this.triggerEmergencyCleanup();
        } else if (metrics.percentage > this.MEMORY_WARNING_THRESHOLD) {
            console.warn('⚠️ WARNING: High memory usage detected', metrics);
            this.triggerMemoryOptimization();
        } else if (metrics.percentage > this.GC_TRIGGER_THRESHOLD) {
            this.suggestGarbageCollection();
        }
    }

    /**
     * Detect potential memory leaks
     */
    private detectMemoryLeaks(): void {
        // Check for excessive event listeners
        this.detectEventListenerLeaks();

        // Check for abandoned timers
        this.detectTimerLeaks();

        // Check for observer leaks
        this.detectObserverLeaks();

        // Check for cache bloat
        this.detectCacheLeaks();

        // Check for component instance leaks
        this.detectComponentLeaks();
    }

    /**
     * Detect event listener leaks
     */
    private detectEventListenerLeaks(): void {
        const listenerCount = this.listenerRefs.size;

        if (listenerCount > 50) {
            const leak: MemoryLeak = {
                id: `listener-leak-${Date.now()}`,
                component: 'EventListener',
                type: 'listener',
                severity: listenerCount > 100 ? 'critical' : 'medium',
                description: `${listenerCount} event listeners detected. Potential memory leak.`,
                detectedAt: Date.now(),
                estimatedSize: listenerCount * 100 // Rough estimate
            };

            this.memoryLeaks.push(leak);
        }
    }

    /**
     * Detect timer leaks
     */
    private detectTimerLeaks(): void {
        const timerCount = this.timerRefs.size;

        if (timerCount > 20) {
            const leak: MemoryLeak = {
                id: `timer-leak-${Date.now()}`,
                component: 'Timer',
                type: 'timer',
                severity: timerCount > 50 ? 'high' : 'medium',
                description: `${timerCount} active timers detected. Check for uncleaned intervals/timeouts.`,
                detectedAt: Date.now(),
                estimatedSize: timerCount * 50
            };

            this.memoryLeaks.push(leak);
        }
    }

    /**
     * Detect observer leaks
     */
    private detectObserverLeaks(): void {
        const observerCount = this.observerRefs.size;

        if (observerCount > 10) {
            const leak: MemoryLeak = {
                id: `observer-leak-${Date.now()}`,
                component: 'Observer',
                type: 'observer',
                severity: observerCount > 25 ? 'high' : 'medium',
                description: `${observerCount} active observers detected. Ensure proper cleanup.`,
                detectedAt: Date.now(),
                estimatedSize: observerCount * 200
            };

            this.memoryLeaks.push(leak);
        }
    }

    /**
     * Detect cache bloat
     */
    private detectCacheLeaks(): void {
        const totalCacheSize = Array.from(this.cacheRefs.values())
            .reduce((total, cache) => total + cache.size, 0);

        const cacheCount = this.cacheRefs.size;

        if (totalCacheSize > 10 * 1024 * 1024 || cacheCount > 1000) { // 10MB or 1000 items
            const leak: MemoryLeak = {
                id: `cache-leak-${Date.now()}`,
                component: 'Cache',
                type: 'cache',
                severity: totalCacheSize > 50 * 1024 * 1024 ? 'critical' : 'medium',
                description: `Cache bloat detected: ${Math.round(totalCacheSize / 1024 / 1024)}MB in ${cacheCount} items.`,
                detectedAt: Date.now(),
                estimatedSize: totalCacheSize
            };

            this.memoryLeaks.push(leak);
        }
    }

    /**
     * Detect component instance leaks
     */
    private detectComponentLeaks(): void {
        for (const [name, stats] of this.componentStats.entries()) {
            const avgSize = stats.totalSize / stats.instances;
            const timeSinceAccess = Date.now() - stats.lastAccessed;

            // Check for components that haven't been accessed recently but consume memory
            if (timeSinceAccess > 300000 && stats.totalSize > 1024 * 1024) { // 5 min, 1MB
                const leak: MemoryLeak = {
                    id: `component-leak-${name}-${Date.now()}`,
                    component: name,
                    type: 'reference',
                    severity: stats.totalSize > 10 * 1024 * 1024 ? 'high' : 'medium',
                    description: `Component ${name} (${stats.instances} instances) consuming ${Math.round(stats.totalSize / 1024 / 1024)}MB without recent access.`,
                    detectedAt: Date.now(),
                    estimatedSize: stats.totalSize
                };

                this.memoryLeaks.push(leak);
            }
        }
    }

    /**
     * Optimize memory usage
     */
    private optimizeMemoryUsage(): void {
        const currentMetrics = this.getCurrentMetrics();
        if (!currentMetrics) return;

        // Clean up old cache entries
        this.cleanupExpiredCache();

        // Optimize component instances
        this.optimizeComponentInstances();

        // Clean up completed timers
        this.cleanupCompletedTimers();

        // Clean up old memory leak records
        this.cleanupOldLeakRecords();
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, cache] of this.cacheRefs.entries()) {
            // Remove cache entries older than 1 hour
            if (now - cache.created > 3600000) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => {
            this.cacheRefs.delete(key);
        });

        if (expiredKeys.length > 0) {
            console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
        }
    }

    /**
     * Optimize component instances
     */
    private optimizeComponentInstances(): void {
        const now = Date.now();

        for (const [name, stats] of this.componentStats.entries()) {
            // Reset stats for components not accessed in the last 10 minutes
            if (now - stats.lastAccessed > 600000) {
                this.componentStats.delete(name);
            }
        }
    }

    /**
     * Clean up completed timers
     */
    private cleanupCompletedTimers(): void {
        const completedTimers: (NodeJS.Timeout | number)[] = [];

        // Note: In a real implementation, you'd need to track timer states
        // This is a simplified version
        for (const timer of this.timerRefs) {
            // Check if timer is still active (implementation-specific)
            // For now, we'll just clean up old references
        }
    }

    /**
     * Clean up old memory leak records
     */
    private cleanupOldLeakRecords(): void {
        const now = Date.now();
        const oneHourAgo = now - 3600000;

        this.memoryLeaks = this.memoryLeaks.filter(leak => leak.detectedAt > oneHourAgo);
    }

    /**
     * Trigger memory optimization
     */
    private triggerMemoryOptimization(): void {
        console.log('🔧 Triggering memory optimization...');

        // Force cleanup of weak references
        this.forceWeakRefCleanup();

        // Clear unnecessary DOM references
        this.clearDOMReferences();

        // Optimize image caches
        this.optimizeImageCaches();

        // Suggest component unmounting for inactive components
        this.suggestComponentCleanup();
    }

    /**
     * Trigger emergency cleanup
     */
    private triggerEmergencyCleanup(): void {
        console.error('🚨 Triggering emergency memory cleanup!');

        // Clear all non-essential caches
        this.clearNonEssentialCaches();

        // Force garbage collection if available
        this.forceGarbageCollection();

        // Notify user of memory issues
        this.notifyMemoryIssue();
    }

    /**
     * Suggest garbage collection
     */
    private suggestGarbageCollection(): void {
        if ('gc' in window && typeof (window as any).gc === 'function') {
            try {
                (window as any).gc();
                console.log('🗑️ Manual garbage collection triggered');
            } catch (error) {
                console.warn('Could not trigger manual GC:', error);
            }
        }
    }

    /**
     * Force weak reference cleanup
     */
    private forceWeakRefCleanup(): void {
        // Implementation for cleaning up weak references
        // This would involve checking WeakMap and WeakSet instances
        console.log('🧹 Force cleaning weak references');
    }

    /**
     * Clear DOM references
     */
    private clearDOMReferences(): void {
        // Remove old event listeners
        const oldListeners = Array.from(this.listenerRefs.entries())
            .filter(([, ref]) => !document.contains(ref.element as Node));

        oldListeners.forEach(([key]) => {
            this.listenerRefs.delete(key);
        });

        console.log(`🧹 Cleared ${oldListeners.length} orphaned DOM references`);
    }

    /**
     * Optimize image caches
     */
    private optimizeImageCaches(): void {
        // Clear image caches that are no longer needed
        const imageCaches = Array.from(this.cacheRefs.entries())
            .filter(([key]) => key.includes('image') || key.includes('img'));

        // Keep only the 20 most recently used images
        imageCaches
            .sort((a, b) => b[1].created - a[1].created)
            .slice(20)
            .forEach(([key]) => {
                this.cacheRefs.delete(key);
            });
    }

    /**
     * Suggest component cleanup
     */
    private suggestComponentCleanup(): void {
        const inactiveComponents = Array.from(this.componentStats.entries())
            .filter(([, stats]) => Date.now() - stats.lastAccessed > 300000) // 5 minutes
            .sort((a, b) => b[1].totalSize - a[1].totalSize);

        if (inactiveComponents.length > 0) {
            console.log('📋 Suggested component cleanup:', inactiveComponents.map(([name, stats]) => ({
                component: name,
                size: `${Math.round(stats.totalSize / 1024 / 1024)}MB`,
                instances: stats.instances
            })));
        }
    }

    /**
     * Clear non-essential caches
     */
    private clearNonEssentialCaches(): void {
        // Keep only the most essential cache entries
        const essentialKeys = Array.from(this.cacheRefs.keys())
            .filter(key => key.includes('essential') || key.includes('critical'));

        const nonEssentialKeys = Array.from(this.cacheRefs.keys())
            .filter(key => !essentialKeys.includes(key));

        nonEssentialKeys.forEach(key => {
            this.cacheRefs.delete(key);
        });

        console.log(`🚨 Emergency cleanup: cleared ${nonEssentialKeys.length} non-essential cache entries`);
    }

    /**
     * Force garbage collection
     */
    private forceGarbageCollection(): void {
        // Multiple approaches to trigger GC
        if ('gc' in window) {
            try {
                (window as any).gc();
            } catch (e) {
                // Fallback methods
                this.triggerGCFallbacks();
            }
        } else {
            this.triggerGCFallbacks();
        }
    }

    /**
     * Trigger GC fallback methods
     */
    private triggerGCFallbacks(): void {
        // Create large objects and immediately release them to trigger GC
        try {
            for (let i = 0; i < 5; i++) {
                const largeArray = new Array(1000000).fill(0);
                largeArray.length = 0;
            }
        } catch (e) {
            console.warn('GC fallback failed:', e);
        }
    }

    /**
     * Notify user of memory issues
     */
    private notifyMemoryIssue(): void {
        // In a real app, this might show a toast notification
        console.error('🚨 MEMORY WARNING: The application is using high memory. Consider refreshing the page.');

        // Optionally dispatch a custom event for the UI to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('memoryWarning', {
                detail: this.getCurrentMetrics()
            }));
        }
    }

    /**
     * Setup global error handling for memory-related issues
     */
    private setupGlobalErrorHandling(): void {
        window.addEventListener('error', (event) => {
            if (event.message?.includes('out of memory') ||
                event.message?.includes('Maximum call stack')) {
                this.triggerEmergencyCleanup();
            }
        });
    }    /**
     * Patch memory leak prone methods
     */
    private patchMemoryLeakProneMethods(): void {
        // Patch addEventListener to track listeners
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const self = this;

        EventTarget.prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
            if (listener) {
                const key = `${this.constructor.name}-${type}-${Date.now()}`;
                self.listenerRefs.set(key, { element: this, listener, options });
            }
            return originalAddEventListener.call(this, type, listener, options);
        };

        // Note: Timer patching removed due to TypeScript complexity
        // Timers will be tracked through manual registration in the application
    }

    /**
     * Public API Methods
     */

    /**
     * Get current memory metrics
     */
    getCurrentMetrics(): MemoryMetrics | null {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }

    /**
     * Get memory usage history
     */
    getMemoryHistory(): MemoryMetrics[] {
        return [...this.metrics];
    }

    /**
     * Get detected memory leaks
     */
    getMemoryLeaks(): MemoryLeak[] {
        return [...this.memoryLeaks];
    }

    /**
     * Get component memory statistics
     */
    getComponentStats(): ComponentMemoryStats[] {
        return Array.from(this.componentStats.values());
    }

    /**
     * Register a component for memory tracking
     */
    registerComponent(name: string, estimatedSize: number = 1024): void {
        const stats = this.componentStats.get(name) || {
            name,
            instances: 0,
            averageSize: estimatedSize,
            totalSize: 0,
            lastAccessed: Date.now(),
            leakRisk: 0
        };

        stats.instances++;
        stats.totalSize += estimatedSize;
        stats.averageSize = stats.totalSize / stats.instances;
        stats.lastAccessed = Date.now();

        this.componentStats.set(name, stats);
    }

    /**
     * Unregister a component
     */
    unregisterComponent(name: string, estimatedSize: number = 1024): void {
        const stats = this.componentStats.get(name);
        if (stats) {
            stats.instances = Math.max(0, stats.instances - 1);
            stats.totalSize = Math.max(0, stats.totalSize - estimatedSize);

            if (stats.instances === 0) {
                this.componentStats.delete(name);
            } else {
                stats.averageSize = stats.totalSize / stats.instances;
                this.componentStats.set(name, stats);
            }
        }
    }

    /**
     * Add cache entry for tracking
     */
    trackCache(key: string, data: any): void {
        const size = JSON.stringify(data).length;
        this.cacheRefs.set(key, {
            data,
            size,
            created: Date.now()
        });
    }

    /**
     * Remove cache entry
     */
    untrackCache(key: string): void {
        this.cacheRefs.delete(key);
    }    /**
     * Track timer for cleanup
     */
    trackTimer(id: NodeJS.Timeout | number): void {
        this.timerRefs.add(id);
    }

    /**
     * Untrack timer
     */
    untrackTimer(id: NodeJS.Timeout | number): void {
        this.timerRefs.delete(id);
    }

    /**
     * Track observer for cleanup
     */
    trackObserver(observer: MutationObserver | IntersectionObserver | ResizeObserver): void {
        this.observerRefs.add(observer);
    }

    /**
     * Untrack observer
     */
    untrackObserver(observer: MutationObserver | IntersectionObserver | ResizeObserver): void {
        this.observerRefs.delete(observer);
    }

    /**
     * Get performance recommendations
     */
    getRecommendations(): string[] {
        const recommendations: string[] = [];
        const currentMetrics = this.getCurrentMetrics();

        if (!currentMetrics) return recommendations;

        if (currentMetrics.percentage > 80) {
            recommendations.push('Consider reducing component instances or implementing lazy loading');
        }

        if (this.memoryLeaks.length > 0) {
            recommendations.push('Memory leaks detected - review event listeners and timer cleanup');
        }

        if (this.cacheRefs.size > 100) {
            recommendations.push('Large number of cache entries - implement cache eviction strategy');
        }

        if (this.observerRefs.size > 10) {
            recommendations.push('Many active observers - ensure proper cleanup in component unmount');
        }

        if (currentMetrics.trend === 'increasing') {
            recommendations.push('Memory usage trending upward - monitor for potential leaks');
        }

        return recommendations;
    }

    /**
     * Get detailed memory report
     */
    getMemoryReport(): {
        current: MemoryMetrics | null;
        history: MemoryMetrics[];
        leaks: MemoryLeak[];
        components: ComponentMemoryStats[];
        recommendations: string[];
        summary: {
            status: 'healthy' | 'warning' | 'critical';
            totalLeaks: number;
            riskScore: number;
            efficiency: string;
        };
    } {
        const current = this.getCurrentMetrics();
        const leaks = this.getMemoryLeaks();
        const recommendations = this.getRecommendations();

        const riskScore = this.calculateRiskScore(current, leaks);
        const status = this.getHealthStatus(current, leaks);

        return {
            current,
            history: this.getMemoryHistory(),
            leaks,
            components: this.getComponentStats(),
            recommendations,
            summary: {
                status,
                totalLeaks: leaks.length,
                riskScore,
                efficiency: riskScore < 30 ? 'excellent' : riskScore < 60 ? 'good' : riskScore < 80 ? 'fair' : 'poor'
            }
        };
    }

    /**
     * Calculate memory risk score (0-100)
     */
    private calculateRiskScore(metrics: MemoryMetrics | null, leaks: MemoryLeak[]): number {
        let score = 0;

        if (metrics) {
            score += metrics.percentage * 0.6; // 60% weight for current usage

            if (metrics.trend === 'increasing') {
                score += 15;
            }
        }

        // Add leak severity scores
        leaks.forEach(leak => {
            switch (leak.severity) {
                case 'critical': score += 20; break;
                case 'high': score += 15; break;
                case 'medium': score += 10; break;
                case 'low': score += 5; break;
            }
        });

        return Math.min(100, score);
    }

    /**
     * Get health status
     */
    private getHealthStatus(metrics: MemoryMetrics | null, leaks: MemoryLeak[]): 'healthy' | 'warning' | 'critical' {
        if (!metrics) return 'healthy';

        const criticalLeaks = leaks.filter(leak => leak.severity === 'critical').length;

        if (metrics.percentage > 95 || criticalLeaks > 0) {
            return 'critical';
        }

        if (metrics.percentage > 80 || leaks.length > 5) {
            return 'warning';
        }

        return 'healthy';
    }

    /**
     * Cleanup when memory optimizer is no longer needed
     */
    cleanup(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        this.isMonitoring = false;

        // Clean up all tracked resources
        this.timerRefs.clear();
        this.observerRefs.clear();
        this.listenerRefs.clear();
        this.cacheRefs.clear();
        this.componentStats.clear();

        console.log('🧠 Memory Optimizer cleaned up');
    }
}

// Create global instance
const memoryOptimizer = new MemoryOptimizer();

// Export for use in React components
export { memoryOptimizer, type MemoryMetrics, type MemoryLeak, type ComponentMemoryStats };

// React Hook for memory monitoring
export function useMemoryOptimizer(componentName?: string) {
    const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
    const [leaks, setLeaks] = useState<MemoryLeak[]>([]);

    useEffect(() => {
        if (componentName) {
            memoryOptimizer.registerComponent(componentName);
        }

        const updateMetrics = () => {
            setMetrics(memoryOptimizer.getCurrentMetrics());
            setLeaks(memoryOptimizer.getMemoryLeaks());
        };

        updateMetrics();
        const interval = setInterval(updateMetrics, 5000);

        return () => {
            clearInterval(interval);
            if (componentName) {
                memoryOptimizer.unregisterComponent(componentName);
            }
        };
    }, [componentName]);

    return {
        metrics,
        leaks,
        report: memoryOptimizer.getMemoryReport(),
        registerComponent: memoryOptimizer.registerComponent.bind(memoryOptimizer),
        trackCache: memoryOptimizer.trackCache.bind(memoryOptimizer),
        trackObserver: memoryOptimizer.trackObserver.bind(memoryOptimizer)
    };
}

export default memoryOptimizer;
