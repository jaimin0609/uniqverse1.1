// Memory Leak Comprehensive Analysis Script
// Run this in the browser console to detect active memory leaks

function performMemoryLeakAnalysis() {
    console.log('🔍 Starting Comprehensive Memory Leak Analysis...\n');
    
    const report = {
        timestamp: new Date().toISOString(),
        intervals: [],
        timeouts: [],
        eventListeners: 0,
        observers: 0,
        potentialLeaks: [],
        recommendations: []
    };

    // Check for active intervals
    const highestIntervalId = setTimeout(() => {}, 0);
    clearTimeout(highestIntervalId);
    
    let activeIntervals = 0;
    for (let i = 1; i <= highestIntervalId; i++) {
        try {
            const intervalCleared = clearInterval(i);
            if (intervalCleared === undefined) {
                // This might be an active interval
                activeIntervals++;
            }
        } catch (e) {
            // Silent catch
        }
    }
    
    report.intervals = [`Estimated active intervals: ${activeIntervals}`];
    if (activeIntervals > 5) {
        report.potentialLeaks.push(`High number of active intervals detected: ${activeIntervals}`);
        report.recommendations.push('Review setInterval usage and ensure proper cleanup in useEffect');
    }

    // Check for active timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    clearTimeout(highestTimeoutId);
    
    let activeTimeouts = 0;
    for (let i = 1; i <= highestTimeoutId; i++) {
        try {
            const timeoutCleared = clearTimeout(i);
            if (timeoutCleared === undefined) {
                activeTimeouts++;
            }
        } catch (e) {
            // Silent catch
        }
    }
    
    report.timeouts = [`Estimated active timeouts: ${activeTimeouts}`];
    if (activeTimeouts > 20) {
        report.potentialLeaks.push(`High number of active timeouts detected: ${activeTimeouts}`);
        report.recommendations.push('Review setTimeout usage and ensure proper cleanup');
    }

    // Check event listeners on common elements
    const elementsToCheck = [window, document, document.body];
    let totalListeners = 0;
    
    elementsToCheck.forEach(element => {
        if (element && element._leakDetector_listeners) {
            for (const [eventType, listeners] of element._leakDetector_listeners) {
                totalListeners += listeners.size;
                console.log(`Found ${listeners.size} listeners for '${eventType}' on ${element.constructor.name}`);
            }
        }
    });
    
    // Check all DOM elements for listeners
    document.querySelectorAll('*').forEach(element => {
        if (element._leakDetector_listeners) {
            for (const [eventType, listeners] of element._leakDetector_listeners) {
                totalListeners += listeners.size;
            }
        }
    });
    
    report.eventListeners = totalListeners;
    if (totalListeners > 100) {
        report.potentialLeaks.push(`High number of event listeners detected: ${totalListeners}`);
        report.recommendations.push('Review addEventListener usage and ensure removeEventListener is called');
    }

    // Memory usage analysis
    if ('memory' in performance) {
        const memInfo = performance.memory;
        report.memoryUsage = {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        };
        
        const usagePercentage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        if (usagePercentage > 70) {
            report.potentialLeaks.push(`High memory usage: ${usagePercentage.toFixed(1)}%`);
            report.recommendations.push('Consider memory optimization and garbage collection');
        }
    }

    // Check for React-specific leaks
    const reactFiber = document.querySelector('#__next')?._reactInternalFiber;
    if (reactFiber) {
        report.reactInfo = 'React app detected - check React DevTools for component memory usage';
    }

    // Performance analysis
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
        report.pageLoadTime = Math.round(navigation.loadEventEnd - navigation.loadEventStart) + 'ms';
    }

    // Display results
    console.log('📊 Memory Leak Analysis Report:');
    console.log('================================');
    console.table(report);
    
    if (report.potentialLeaks.length === 0) {
        console.log('✅ No significant memory leaks detected!');
    } else {
        console.warn('⚠️ Potential Memory Leaks Detected:');
        report.potentialLeaks.forEach(leak => console.warn(`- ${leak}`));
        
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    return report;
}

// Run the analysis
performMemoryLeakAnalysis();
