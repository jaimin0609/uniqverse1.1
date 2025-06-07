// Live 3D Customization System Test
// Open browser dev tools and run: loadScript('/test-live-customization.js')

console.log('🎨 Live 3D Customization System Test');
console.log('===================================');

function runLiveTest() {
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: {},
        errors: [],
        warnings: []
    };

    // Test 1: Check if page loaded
    testResults.tests.pageLoaded = document.readyState === 'complete';
    console.log('✅ Page loaded:', testResults.tests.pageLoaded);

    // Test 2: Find main customizer component
    const customizerElement = document.querySelector('[class*="customizer"], .min-h-screen');
    testResults.tests.customizerFound = !!customizerElement;
    console.log('✅ Customizer component found:', testResults.tests.customizerFound);

    // Test 3: Check for canvas elements
    const canvases = document.querySelectorAll('canvas');
    testResults.tests.canvasCount = canvases.length;
    console.log('✅ Canvas elements found:', canvases.length);

    // Test 4: Find sync controls
    const buttons = Array.from(document.querySelectorAll('button'));
    const syncButton = buttons.find(btn => btn.textContent?.includes('Real-time Sync'));
    const manualSyncButton = buttons.find(btn => btn.textContent?.includes('Manual Sync'));
    
    testResults.tests.syncControlsFound = !!(syncButton && manualSyncButton);
    console.log('✅ Sync controls found:', testResults.tests.syncControlsFound);

    // Test 5: Check tabs (2D/3D toggle)
    const tabs = document.querySelectorAll('[role="tab"], .bg-primary');
    testResults.tests.tabsFound = tabs.length >= 2;
    console.log('✅ 2D/3D tabs found:', testResults.tests.tabsFound);

    // Test 6: Test sync button functionality
    if (syncButton) {
        testResults.tests.syncButtonClickable = !syncButton.disabled;
        console.log('✅ Sync button clickable:', testResults.tests.syncButtonClickable);
    }

    // Test 7: Check for price display
    const priceElements = document.querySelectorAll('[class*="price"], .text-lg');
    const priceFound = Array.from(priceElements).some(el => 
        el.textContent?.includes('$') || el.textContent?.includes('29.99')
    );
    testResults.tests.priceDisplayFound = priceFound;
    console.log('✅ Price display found:', testResults.tests.priceDisplayFound);

    // Test 8: Check for feature highlights
    const featureElements = document.querySelectorAll('[class*="feature"], .bg-blue-50, .bg-green-50');
    testResults.tests.featuresDisplayed = featureElements.length >= 3;
    console.log('✅ Feature highlights displayed:', testResults.tests.featuresDisplayed);

    // Interactive Tests
    console.log('\n🧪 Interactive Tests Available:');
    console.log('================================');
    
    // Add interactive test functions to window
    window.testSync = function() {
        console.log('🔄 Testing sync functionality...');
        if (syncButton) {
            syncButton.click();
            console.log('✅ Sync button clicked');
            setTimeout(() => {
                console.log('⏱️ Sync should be completed');
            }, 1000);
        } else {
            console.log('❌ Sync button not found');
        }
    };

    window.testModeSwitch = function() {
        console.log('🔄 Testing mode switch...');
        const designTab = Array.from(tabs).find(tab => 
            tab.textContent?.includes('Design') || tab.textContent?.includes('2D')
        );
        const previewTab = Array.from(tabs).find(tab => 
            tab.textContent?.includes('Preview') || tab.textContent?.includes('3D')
        );
        
        if (designTab && previewTab) {
            console.log('✅ Switching to 3D mode...');
            previewTab.click();
            setTimeout(() => {
                console.log('✅ Switching back to 2D mode...');
                designTab.click();
            }, 2000);
        } else {
            console.log('❌ Mode tabs not found');
        }
    };

    window.testManualSync = function() {
        console.log('🔄 Testing manual sync...');
        if (manualSyncButton) {
            manualSyncButton.click();
            console.log('✅ Manual sync triggered');
        } else {
            console.log('❌ Manual sync button not found');
        }
    };

    window.testCollaboration = function() {
        console.log('🔄 Testing collaboration toggle...');
        const collabButton = buttons.find(btn => btn.textContent?.includes('Collaborate'));
        if (collabButton) {
            collabButton.click();
            console.log('✅ Collaboration toggled');
        } else {
            console.log('❌ Collaboration button not found');
        }
    };

    window.testAdvancedTools = function() {
        console.log('🔄 Testing advanced tools...');
        const toolsButton = buttons.find(btn => btn.textContent?.includes('Pro Tools'));
        if (toolsButton) {
            toolsButton.click();
            console.log('✅ Advanced tools toggled');
        } else {
            console.log('❌ Advanced tools button not found');
        }
    };

    // Print interactive commands
    console.log('Run these commands to test interactively:');
    console.log('• testSync() - Test real-time sync');
    console.log('• testModeSwitch() - Test 2D/3D mode switching');
    console.log('• testManualSync() - Test manual sync');
    console.log('• testCollaboration() - Test collaboration toggle');
    console.log('• testAdvancedTools() - Test advanced tools');

    // Calculate overall score
    const totalTests = Object.keys(testResults.tests).length;
    const passedTests = Object.values(testResults.tests).filter(Boolean).length;
    const score = Math.round((passedTests / totalTests) * 100);

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    console.log(`Overall score: ${score}%`);
    
    if (score >= 80) {
        console.log('🎉 System appears to be working well!');
    } else if (score >= 60) {
        console.log('⚠️  System partially working, some issues detected');
    } else {
        console.log('❌ System has significant issues');
    }

    return testResults;
}

// Auto-run test when loaded
if (document.readyState === 'complete') {
    runLiveTest();
} else {
    document.addEventListener('DOMContentLoaded', runLiveTest);
}

// Export test function
window.runLiveTest = runLiveTest;
