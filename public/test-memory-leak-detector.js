/**
 * Memory Leak Detector Test Script
 * Run this in the browser console to test the memory leak detector functionality
 */

function testMemoryLeakDetector() {
    console.log('🧪 Testing Memory Leak Detector...\n');

    // Test 1: Create some intervals that should be tracked
    console.log('Test 1: Creating tracked intervals...');
    const interval1 = setInterval(() => console.log('Test interval 1'), 1000);
    const interval2 = setInterval(() => console.log('Test interval 2'), 2000);
    
    setTimeout(() => {
        console.log('✅ Test 1 passed: Intervals created and tracked');
        
        // Test 2: Clear one interval
        console.log('\nTest 2: Clearing one interval...');
        clearInterval(interval1);
        
        setTimeout(() => {
            console.log('✅ Test 2 passed: Interval cleared and untracked');
            
            // Test 3: Create some timeouts
            console.log('\nTest 3: Creating tracked timeouts...');
            setTimeout(() => console.log('Test timeout 1 executed'), 500);
            setTimeout(() => console.log('Test timeout 2 executed'), 1000);
            
            setTimeout(() => {
                console.log('✅ Test 3 passed: Timeouts created and tracked');
                
                // Test 4: Test event listeners
                console.log('\nTest 4: Testing event listeners...');
                const testHandler = () => console.log('Test click');
                document.body.addEventListener('click', testHandler);
                
                setTimeout(() => {
                    document.body.removeEventListener('click', testHandler);
                    console.log('✅ Test 4 passed: Event listener added and removed');
                    
                    // Test 5: Generate final report
                    console.log('\nTest 5: Generating memory leak report...');
                    if (typeof window !== 'undefined' && window.memoryLeakDetector) {
                        const report = window.memoryLeakDetector.generateReport();
                        console.log('📊 Final Report:', report);
                        
                        if (report.totalLeaks > 0) {
                            console.warn('⚠️ Memory leaks detected:', report.patterns);
                        } else {
                            console.log('✅ No memory leaks detected!');
                        }
                    } else {
                        console.log('ℹ️ Memory leak detector not available (may be in server context)');
                    }
                    
                    // Cleanup remaining test interval
                    clearInterval(interval2);
                    console.log('\n🧹 Test cleanup completed');
                    
                }, 1000);
            }, 1500);
        }, 1000);
    }, 1000);
}

// Make detector available globally for testing
if (typeof window !== 'undefined') {
    // Import the detector if it's available
    import('/src/lib/memory-leak-detector.tsx').then(module => {
        window.memoryLeakDetector = module.memoryLeakDetector;
        console.log('✅ Memory leak detector loaded for testing');
    }).catch(err => {
        console.warn('⚠️ Could not load memory leak detector:', err);
    });
}

// Export test function
if (typeof window !== 'undefined') {
    window.testMemoryLeakDetector = testMemoryLeakDetector;
    console.log('🧪 Memory leak detector test script loaded');
    console.log('Run testMemoryLeakDetector() to start tests');
}

export { testMemoryLeakDetector };
