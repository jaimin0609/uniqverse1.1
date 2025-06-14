/**
 * Memory Leak Prevention Component
 * Add this to your main layout to monitor memory leaks in development
 */
"use client";

import { useEffect } from 'react';
import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';

interface MemoryLeakMonitorProps {
    enabled?: boolean;
    reportInterval?: number; // in milliseconds
}

export function MemoryLeakMonitor({
    enabled = process.env.NODE_ENV === 'development',
    reportInterval = 30000 // 30 seconds
}: MemoryLeakMonitorProps) {
    const { generateReport } = useMemoryLeakDetection('MemoryLeakMonitor');

    // Main monitoring effect
    useEffect(() => {
        if (!enabled) return;

        console.log('🔍 Memory Leak Monitor: Starting...');

        // Silent monitoring - only log critical issues
        const interval = setInterval(() => {
            const report = generateReport();

            // Only log if there are significant leaks (reduce noise)
            if (report.totalLeaks > 5) {
                console.warn('⚠️ Significant Memory Leaks Detected:', report);
            }

            // No toast notifications - data is available in admin dashboard
        }, reportInterval);

        return () => {
            clearInterval(interval);
            console.log('🧹 Memory Leak Monitor: Stopped');
        };
    }, [enabled, reportInterval, generateReport]);

    // Monitor page visibility to pause monitoring when tab is not active
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('📱 Memory Leak Monitor: Paused (tab hidden)');
            } else {
                console.log('📱 Memory Leak Monitor: Resumed (tab visible)');
                // Generate a report when tab becomes visible again
                const report = generateReport();
                if (report.totalLeaks > 0) {
                    console.warn('⚠️ Memory leaks detected after tab became visible:', report);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled, generateReport]);

    // Monitor for potential memory-intensive navigation
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        let navigationCount = 0;
        const startTime = Date.now();

        const handleBeforeUnload = () => {
            navigationCount++;
            const timeElapsed = Date.now() - startTime;

            if (navigationCount > 10 && timeElapsed < 60000) { // More than 10 navigations in 1 minute
                console.warn('⚠️ Rapid navigation detected - potential memory leak risk');
                const report = generateReport();
                console.log('Final memory report before unload:', report);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled, generateReport]);

    return null; // This component doesn't render anything
}

export default MemoryLeakMonitor;
