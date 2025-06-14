// Quick Memory Leak Report Generator
// Copy and paste this into your browser console for an instant report

(function generateMemoryLeakReport() {
    console.log('📊 Generating Memory Leak Report...\n');
    
    // Try to access the global memory leak detector
    if (typeof window !== 'undefined') {
        // Method 1: Try to import the detector
        try {
            // Access React's internal methods to get the detector
            const reactRoot = document.querySelector('#__next');
            if (reactRoot && reactRoot._reactInternalFiber) {
                console.log('React app detected - memory leak detector should be active');
            }
            
            // Method 2: Generate report using React hook simulation
            console.log('Attempting to generate report...');
            
            // Check for active timers manually
            let activeIntervals = 0;
            let activeTimeouts = 0;
            
            // Get the highest timer ID to estimate active timers
            const highestInterval = setInterval(() => {}, 1);
            clearInterval(highestInterval);
            
            const highestTimeout = setTimeout(() => {}, 1);
            clearTimeout(highestTimeout);
            
            console.log(`Estimated timer range: Intervals up to ${highestInterval}, Timeouts up to ${highestTimeout}`);
            
            // Check for event listeners on common elements
            let totalListeners = 0;
            [window, document, document.body].forEach(element => {
                if (element && element._leakDetector_listeners) {
                    for (const [eventType, listeners] of element._leakDetector_listeners) {
                        totalListeners += listeners.size;
                        console.log(`Found ${listeners.size} listeners for '${eventType}' on ${element.constructor.name}`);
                    }
                }
            });
            
            // Check memory usage if available
            let memoryInfo = null;
            if ('memory' in performance) {
                memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                };
            }
            
            const report = {
                timestamp: new Date().toISOString(),
                activeTimers: {
                    intervals: `Up to ${highestInterval}`,
                    timeouts: `Up to ${highestTimeout}`
                },
                eventListeners: totalListeners,
                memoryUsage: memoryInfo,
                recommendations: [
                    'Check browser console for detailed tracking logs',
                    'Use React DevTools to inspect component memory usage',
                    'Monitor Network tab for ongoing requests',
                    'Check for unclosed WebSocket connections'
                ]
            };
            
            console.log('📋 Manual Memory Leak Report:');
            console.table(report);
            
            if (totalListeners > 50) {
                console.warn('⚠️ High number of event listeners detected');
            }
            
            if (memoryInfo && performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.7) {
                console.warn('⚠️ High memory usage detected');
            }
            
            return report;
            
        } catch (error) {
            console.error('Error generating report:', error);
        }
    } else {
        console.log('Not in browser environment');
    }
})();
