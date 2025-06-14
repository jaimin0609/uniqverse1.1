/**
 * Comprehensive Memory Leak Detection and Prevention System
 * Identifies and fixes common memory leak patterns in React applications
 */
"use client";

import { useEffect, useRef, useCallback } from 'react';

// Memory leak detection patterns
interface MemoryLeakPattern {
    type: 'setInterval' | 'setTimeout' | 'addEventListener' | 'observer' | 'subscription';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    sources: string[];
}

interface MemoryLeakReport {
    totalLeaks: number;
    patterns: MemoryLeakPattern[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface IMemoryLeakDetector {
    generateReport(): MemoryLeakReport;
    trackObserver(observer: IntersectionObserver | ResizeObserver | MutationObserver): void;
    untrackObserver(observer: IntersectionObserver | ResizeObserver | MutationObserver): void;
    trackSubscription(unsubscribe: () => void): void;
    untrackSubscription(unsubscribe: () => void): void;
    cleanup(): void;
}

class MemoryLeakDetector implements IMemoryLeakDetector {
    private intervals = new Set<number>();
    private timeouts = new Set<number>();
    private listeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
    private observers = new Set<IntersectionObserver | ResizeObserver | MutationObserver>();
    private subscriptions = new Set<() => void>();

    private originalSetInterval: typeof window.setInterval;
    private originalSetTimeout: typeof window.setTimeout;
    private originalAddEventListener: typeof EventTarget.prototype.addEventListener;
    private originalRemoveEventListener: typeof EventTarget.prototype.removeEventListener;

    constructor() {
        // Only initialize in browser environment
        if (typeof window !== 'undefined') {
            this.originalSetInterval = window.setInterval.bind(window);
            this.originalSetTimeout = window.setTimeout.bind(window);
            this.originalAddEventListener = EventTarget.prototype.addEventListener;
            this.originalRemoveEventListener = EventTarget.prototype.removeEventListener;
            this.patchGlobalMethods();
        } else {
            // Server-side fallbacks
            this.originalSetInterval = (() => 0) as any;
            this.originalSetTimeout = (() => 0) as any;
            this.originalAddEventListener = (() => { }) as any;
            this.originalRemoveEventListener = (() => { }) as any;
        }
    } private patchGlobalMethods() {
        // Only patch in browser environment
        if (typeof window === 'undefined') {
            return;
        }

        // Store original methods
        const originalSetInterval = this.originalSetInterval;
        const originalSetTimeout = this.originalSetTimeout;
        const originalClearInterval = window.clearInterval.bind(window);
        const originalClearTimeout = window.clearTimeout.bind(window);        // Patch setInterval with minimal logging
        const patchedSetInterval = (...args: Parameters<typeof window.setInterval>) => {
            const id = originalSetInterval(...args);
            this.intervals.add(Number(id));
            // Only log in development and when many intervals are active
            if (process.env.NODE_ENV === 'development' && this.intervals.size > 10) {
                console.warn(`🔍 High interval count: ${this.intervals.size} active intervals`);
            }
            return id;
        };
        Object.assign(window, { setInterval: patchedSetInterval });

        // Patch setTimeout with minimal logging
        const patchedSetTimeout = (...args: Parameters<typeof window.setTimeout>) => {
            const id = originalSetTimeout(...args);
            this.timeouts.add(Number(id));
            // Only log in development and when many timeouts are active
            if (process.env.NODE_ENV === 'development' && this.timeouts.size > 20) {
                console.warn(`🔍 High timeout count: ${this.timeouts.size} active timeouts`);
            }
            return id;
        };
        Object.assign(window, { setTimeout: patchedSetTimeout });

        // Patch clearInterval with minimal logging
        const patchedClearInterval = (...args: Parameters<typeof window.clearInterval>) => {
            const id = args[0];
            if (id !== undefined) {
                originalClearInterval(...args);
                this.intervals.delete(Number(id));
            }
        };
        Object.assign(window, { clearInterval: patchedClearInterval });

        // Patch clearTimeout with minimal logging
        const patchedClearTimeout = (...args: Parameters<typeof window.clearTimeout>) => {
            const id = args[0];
            if (id !== undefined) {
                originalClearTimeout(...args);
                this.timeouts.delete(Number(id));
            }
        };
        Object.assign(window, { clearTimeout: patchedClearTimeout });

        // Patch addEventListener
        const self = this;
        EventTarget.prototype.addEventListener = function (
            type: string,
            listener: EventListenerOrEventListenerObject | null,
            options?: boolean | AddEventListenerOptions
        ) {
            const target = this as any;
            if (!target._leakDetector_listeners) {
                target._leakDetector_listeners = new Map();
            }
            if (!target._leakDetector_listeners.has(type)) {
                target._leakDetector_listeners.set(type, new Set());
            } if (listener) {
                target._leakDetector_listeners.get(type)?.add(listener);
                // Reduced logging - only warn when many listeners accumulate
                const totalListeners = target._leakDetector_listeners.get(type)?.size || 0;
                if (process.env.NODE_ENV === 'development' && totalListeners > 20) {
                    console.warn(`🔍 High listener count for '${type}': ${totalListeners} listeners`);
                }
            }
            return self.originalAddEventListener.call(this, type, listener, options);
        };

        // Patch removeEventListener
        EventTarget.prototype.removeEventListener = function (
            type: string,
            listener: EventListenerOrEventListenerObject | null,
            options?: boolean | EventListenerOptions
        ) {
            const target = this as any;
            if (target._leakDetector_listeners?.has(type) && listener) {
                target._leakDetector_listeners.get(type)?.delete(listener);
                // Minimal logging for removeEventListener
            }
            return self.originalRemoveEventListener.call(this, type, listener, options);
        };
    } trackObserver(observer: IntersectionObserver | ResizeObserver | MutationObserver): void {
        this.observers.add(observer);
        // Only log if many observers are active
        if (process.env.NODE_ENV === 'development' && this.observers.size > 10) {
            console.warn(`🔍 High observer count: ${this.observers.size} active observers`);
        }
    }

    untrackObserver(observer: IntersectionObserver | ResizeObserver | MutationObserver): void {
        this.observers.delete(observer);
        // Minimal logging for observer cleanup
    } trackSubscription(unsubscribe: () => void): void {
        this.subscriptions.add(unsubscribe);
        // Only log if many subscriptions are active
        if (process.env.NODE_ENV === 'development' && this.subscriptions.size > 5) {
            console.warn(`🔍 High subscription count: ${this.subscriptions.size} active subscriptions`);
        }
    }

    untrackSubscription(unsubscribe: () => void): void {
        this.subscriptions.delete(unsubscribe);
        // Minimal logging for subscription cleanup
    }

    generateReport(): MemoryLeakReport {
        const patterns: MemoryLeakPattern[] = [];

        // Check intervals
        if (this.intervals.size > 0) {
            patterns.push({
                type: 'setInterval',
                description: `${this.intervals.size} setInterval calls not properly cleared`,
                severity: this.intervals.size > 10 ? 'critical' : this.intervals.size > 5 ? 'high' : 'medium',
                count: this.intervals.size,
                sources: ['Unknown - use React DevTools to identify components']
            });
        }

        // Check timeouts
        if (this.timeouts.size > 0) {
            patterns.push({
                type: 'setTimeout',
                description: `${this.timeouts.size} setTimeout calls not properly cleared`,
                severity: this.timeouts.size > 20 ? 'high' : 'medium',
                count: this.timeouts.size,
                sources: ['Unknown - use React DevTools to identify components']
            });
        }

        // Check event listeners
        let totalListeners = 0;
        document.querySelectorAll('*').forEach(element => {
            if ((element as any).leakDetector_listeners) {
                const elementListeners = (element as any).leakDetector_listeners;
                for (const [type, listeners] of elementListeners) {
                    totalListeners += listeners.size;
                }
            }
        });

        if (totalListeners > 50) {
            patterns.push({
                type: 'addEventListener',
                description: `${totalListeners} event listeners detected - potential memory leak`,
                severity: totalListeners > 100 ? 'critical' : totalListeners > 75 ? 'high' : 'medium',
                count: totalListeners,
                sources: ['Check components with addEventListener calls']
            });
        }

        // Check observers
        if (this.observers.size > 0) {
            patterns.push({
                type: 'observer',
                description: `${this.observers.size} observers not properly disconnected`,
                severity: this.observers.size > 10 ? 'high' : 'medium',
                count: this.observers.size,
                sources: ['Check components using IntersectionObserver, ResizeObserver, MutationObserver']
            });
        }

        // Check subscriptions
        if (this.subscriptions.size > 0) {
            patterns.push({
                type: 'subscription',
                description: `${this.subscriptions.size} subscriptions not properly unsubscribed`,
                severity: this.subscriptions.size > 5 ? 'high' : 'medium',
                count: this.subscriptions.size,
                sources: ['Check components with Redux, Context, or other subscriptions']
            });
        }

        const totalLeaks = patterns.reduce((sum, pattern) => sum + pattern.count, 0);
        const riskLevel = patterns.some(p => p.severity === 'critical') ? 'critical' :
            patterns.some(p => p.severity === 'high') ? 'high' :
                patterns.some(p => p.severity === 'medium') ? 'medium' : 'low';

        const recommendations = this.generateRecommendations(patterns);

        return {
            totalLeaks,
            patterns,
            recommendations,
            riskLevel
        };
    }

    private generateRecommendations(patterns: MemoryLeakPattern[]): string[] {
        const recommendations: string[] = [];

        patterns.forEach(pattern => {
            switch (pattern.type) {
                case 'setInterval':
                    recommendations.push('Add clearInterval in useEffect cleanup functions');
                    recommendations.push('Use useRef to store interval IDs');
                    break;
                case 'setTimeout':
                    recommendations.push('Add clearTimeout in useEffect cleanup functions');
                    recommendations.push('Clear timeouts when components unmount');
                    break;
                case 'addEventListener':
                    recommendations.push('Add removeEventListener in useEffect cleanup functions');
                    recommendations.push('Store event listeners in refs for proper cleanup');
                    break;
                case 'observer':
                    recommendations.push('Call observer.disconnect() in useEffect cleanup');
                    recommendations.push('Store observers in refs and clean them up');
                    break;
                case 'subscription':
                    recommendations.push('Call unsubscribe functions in useEffect cleanup');
                    recommendations.push('Store subscription cleanup functions properly');
                    break;
            }
        });

        return [...new Set(recommendations)]; // Remove duplicates
    }

    cleanup(): void {
        // Cleanup all tracked resources
        this.intervals.forEach(id => clearInterval(id));
        this.timeouts.forEach(id => clearTimeout(id));
        this.observers.forEach(observer => observer.disconnect());
        this.subscriptions.forEach(unsubscribe => unsubscribe());

        // Clear tracking sets
        this.intervals.clear();
        this.timeouts.clear();
        this.observers.clear();
        this.subscriptions.clear();

        console.log('🧹 Memory Leak Detector: All resources cleaned up');
    }
}

// Global instance - only create in browser environment
let memoryLeakDetector: IMemoryLeakDetector;

if (typeof window !== 'undefined') {
    memoryLeakDetector = new MemoryLeakDetector();
} else {
    // Server-side fallback with no-op methods
    memoryLeakDetector = {
        generateReport: () => ({
            totalLeaks: 0,
            patterns: [],
            recommendations: [],
            riskLevel: 'low' as const
        }),
        trackObserver: () => { },
        untrackObserver: () => { },
        trackSubscription: () => { },
        untrackSubscription: () => { },
        cleanup: () => { }
    };
}

// React hook for memory leak detection
export function useMemoryLeakDetection(componentName?: string) {
    const reportRef = useRef<MemoryLeakReport | null>(null);

    const generateReport = useCallback(() => {
        reportRef.current = memoryLeakDetector.generateReport();

        if (componentName) {
            console.log(`🔍 Memory Leak Report for ${componentName}:`, reportRef.current);
        }

        return reportRef.current;
    }, [componentName]);

    const trackInterval = useCallback((id: NodeJS.Timeout) => {
        // Already tracked by global patches
        return id;
    }, []);

    const trackTimeout = useCallback((id: NodeJS.Timeout) => {
        // Already tracked by global patches
        return id;
    }, []);

    const trackObserver = useCallback((observer: IntersectionObserver | ResizeObserver | MutationObserver) => {
        memoryLeakDetector.trackObserver(observer);
        return observer;
    }, []);

    const trackSubscription = useCallback((unsubscribe: () => void) => {
        memoryLeakDetector.trackSubscription(unsubscribe);
        return unsubscribe;
    }, []);

    useEffect(() => {
        return () => {
            if (componentName) {
                console.log(`🧹 Component ${componentName} unmounted - checking for leaks`);
                generateReport();
            }
        };
    }, [componentName, generateReport]);

    return {
        generateReport,
        trackInterval,
        trackTimeout,
        trackObserver,
        trackSubscription,
        currentReport: reportRef.current
    };
}

// Safe interval hook
export function useSafeInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (delay !== null) {
            intervalRef.current = setInterval(() => savedCallback.current(), delay);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }
    }, [delay]);

    const clearCurrentInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    return clearCurrentInterval;
}

// Safe timeout hook
export function useSafeTimeout(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (delay !== null) {
            timeoutRef.current = setTimeout(() => savedCallback.current(), delay);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            };
        }
    }, [delay]);

    const clearCurrentTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return clearCurrentTimeout;
}

// Safe event listener hook
export function useSafeEventListener<T extends EventTarget>(
    target: T | null,
    eventType: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
) {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    });

    useEffect(() => {
        if (!target) return;

        const eventListener: EventListener = (event) => savedHandler.current(event);
        target.addEventListener(eventType, eventListener, options);

        return () => {
            target.removeEventListener(eventType, eventListener, options);
        };
    }, [target, eventType, options]);
}

// Safe observer hook
export function useSafeObserver<T extends Element>(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<T | null>(null);

    useEffect(() => {
        if (elementRef.current) {
            observerRef.current = new IntersectionObserver(callback, options);
            memoryLeakDetector.trackObserver(observerRef.current);
            observerRef.current.observe(elementRef.current);

            return () => {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    memoryLeakDetector.untrackObserver(observerRef.current);
                    observerRef.current = null;
                }
            };
        }
    }, [callback, options]);

    return elementRef;
}

export { memoryLeakDetector };
export type { MemoryLeakReport, MemoryLeakPattern };
