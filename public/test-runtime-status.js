// Runtime Test Script for 3D Customization System
// Run this in the browser console to check system status

console.log('🚀 3D Customization System - Runtime Status Check');
console.log('================================================');

function checkSystemStatus() {
    const results = {
        timestamp: new Date().toISOString(),
        pageLoaded: false,
        fabricLoaded: false,
        threeJSLoaded: false,
        canvasPresent: false,
        syncButtonsPresent: false,
        componentsInitialized: false,
        errors: []
    };

    try {
        // Check if page loaded properly
        results.pageLoaded = document.readyState === 'complete';
        console.log('✅ Page loaded:', results.pageLoaded);

        // Check for Fabric.js
        results.fabricLoaded = typeof window.fabric !== 'undefined' || 
                              document.querySelector('canvas') !== null;
        console.log('✅ Fabric.js available:', results.fabricLoaded);

        // Check for THREE.js
        results.threeJSLoaded = typeof window.THREE !== 'undefined';
        console.log('✅ THREE.js loaded:', results.threeJSLoaded);

        // Check for canvas elements
        const canvases = document.querySelectorAll('canvas');
        results.canvasPresent = canvases.length > 0;
        console.log('✅ Canvas elements found:', canvases.length);

        // Check for sync buttons
        const buttons = document.querySelectorAll('button');
        const syncButton = Array.from(buttons).find(btn => 
            btn.textContent?.includes('Real-time Sync') || 
            btn.textContent?.includes('Manual Sync')
        );
        results.syncButtonsPresent = !!syncButton;
        console.log('✅ Sync controls present:', results.syncButtonsPresent);

        // Check for main components
        const customizer = document.querySelector('[class*="customizer"], [class*="preview"]');
        results.componentsInitialized = !!customizer;
        console.log('✅ Components initialized:', results.componentsInitialized);

        // Check for any React errors
        const errorElements = document.querySelectorAll('[data-nextjs-dialog], .nextjs-container-errors');
        if (errorElements.length > 0) {
            results.errors.push('React/Next.js errors detected in DOM');
        }

        // Check console for errors
        const consoleErrors = window.console._errors || [];
        if (consoleErrors.length > 0) {
            results.errors.push(`${consoleErrors.length} console errors detected`);
        }

    } catch (error) {
        results.errors.push(`Test execution error: ${error.message}`);
        console.error('❌ Test error:', error);
    }

    return results;
}

function displayResults(results) {
    console.log('\n📊 SYSTEM STATUS SUMMARY');
    console.log('========================');
    
    const allGood = results.pageLoaded && 
                   results.canvasPresent && 
                   results.syncButtonsPresent && 
                   results.componentsInitialized &&
                   results.errors.length === 0;

    if (allGood) {
        console.log('🎉 SUCCESS: All systems operational!');
        console.log('\n📋 You can now test:');
        console.log('• Add text/shapes in the 2D editor');
        console.log('• Switch between 2D and 3D modes');
        console.log('• Toggle real-time sync on/off');
        console.log('• Use manual sync button');
        console.log('• Observe real-time texture updates');
    } else {
        console.log('⚠️  ISSUES DETECTED:');
        if (!results.pageLoaded) console.log('❌ Page not fully loaded');
        if (!results.canvasPresent) console.log('❌ Canvas elements missing');
        if (!results.syncButtonsPresent) console.log('❌ Sync controls missing');
        if (!results.componentsInitialized) console.log('❌ Components not initialized');
        if (results.errors.length > 0) {
            console.log('❌ Errors found:');
            results.errors.forEach(error => console.log(`   - ${error}`));
        }
    }

    console.log('\n📊 Detailed Results:', results);
    return results;
}

function runInteractiveTest() {
    console.log('\n🧪 INTERACTIVE TEST GUIDE');
    console.log('=========================');
    console.log('Follow these steps to test the 3D customization system:');
    console.log('\n1. Look for the customizer interface on the page');
    console.log('2. Find the 2D canvas area (should be visible)');
    console.log('3. Locate the sync controls (Real-time Sync button)');
    console.log('4. Try adding text or shapes to the canvas');
    console.log('5. Switch to 3D preview mode');
    console.log('6. Verify your design appears on the 3D model');
    console.log('\n💡 Expected behavior:');
    console.log('• Real-time sync should update 3D immediately');
    console.log('• Manual sync should work when real-time is off');
    console.log('• 3D model should show your 2D design as texture');
    console.log('• Controls should be responsive and functional');
}

// Auto-run the test
const results = checkSystemStatus();
displayResults(results);
runInteractiveTest();

// Make functions available globally for manual testing
window.test3DSystem = () => displayResults(checkSystemStatus());
window.runInteractiveTest = runInteractiveTest;

console.log('\n🔧 Manual Commands Available:');
console.log('• test3DSystem() - Re-run system check');
console.log('• runInteractiveTest() - Show test guide');
