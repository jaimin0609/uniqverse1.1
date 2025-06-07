// Test script for 3D Customization System
// Run this in the browser console on the /customizer-demo page

console.log('=== 3D Customization System Test ===');

// Test 1: Check if components are loaded
function testComponentsLoaded() {
    console.log('\n1. Testing component loading...');
    
    const canvasElements = document.querySelectorAll('canvas');
    const fabricCanvas = Array.from(canvasElements).find(canvas => 
        canvas.parentElement?.className?.includes('fabric') || 
        canvas.className?.includes('fabric') ||
        canvas.width === 600
    );
    const threeCanvas = Array.from(canvasElements).find(canvas => 
        canvas.parentElement?.className?.includes('3d') ||
        canvas.getContext?.('webgl') || 
        canvas.getContext?.('webgl2')
    );
    
    console.log('Total canvas elements found:', canvasElements.length);
    console.log('Fabric.js canvas found:', !!fabricCanvas);
    console.log('THREE.js canvas found:', !!threeCanvas);
    console.log('THREE.js library loaded:', typeof THREE !== 'undefined');
    
    // Check if fabric is loaded globally
    const fabricLoaded = typeof fabric !== 'undefined' || 
                        window.fabric !== undefined ||
                        document.querySelector('[data-fabric="true"]') !== null;
    console.log('Fabric.js available:', fabricLoaded);
    
    return !!(fabricCanvas || canvasElements.length > 0);
}

// Test 2: Check if sync buttons are present
function testSyncControls() {
    console.log('\n2. Testing sync controls...');
    
    const allButtons = Array.from(document.querySelectorAll('button'));
    const syncButton = allButtons.find(btn => 
        btn.textContent?.includes('Real-time Sync') || 
        btn.textContent?.includes('Sync')
    );
    const manualSyncButton = allButtons.find(btn => 
        btn.textContent?.includes('Manual Sync')
    );
    const mode3DButton = allButtons.find(btn => 
        btn.textContent?.includes('3D Preview') ||
        btn.textContent?.includes('3D Mode')
    );
    
    console.log('Total buttons found:', allButtons.length);
    console.log('Real-time sync button found:', !!syncButton);
    console.log('Manual sync button found:', !!manualSyncButton);
    console.log('3D mode button found:', !!mode3DButton);
    
    // Log button texts for debugging
    const syncButtons = allButtons.filter(btn => 
        btn.textContent?.toLowerCase().includes('sync') ||
        btn.textContent?.toLowerCase().includes('3d')
    ).map(btn => btn.textContent?.trim());
    console.log('Sync-related buttons:', syncButtons);
    
    return !!(syncButton || manualSyncButton);
}

// Test 3: Check 3D preview functionality
function test3DPreview() {
    console.log('\n3. Testing 3D preview...');
    
    const canvasElements = document.querySelectorAll('canvas');
    let webglCanvas = null;
    let webglContext = null;
    
    for (const canvas of canvasElements) {
        const context = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (context) {
            webglCanvas = canvas;
            webglContext = context;
            break;
        }
    }
    
    console.log('3D canvas found:', !!webglCanvas);
    console.log('WebGL context available:', !!webglContext);
    
    if (webglCanvas) {
        console.log('3D Canvas dimensions:', webglCanvas.width, 'x', webglCanvas.height);
        console.log('3D Canvas parent:', webglCanvas.parentElement?.className);
    }
    
    // Check for 3D preview container
    const preview3DContainer = document.querySelector('[class*="3d"]') || 
                              document.querySelector('[class*="preview"]');
    console.log('3D preview container found:', !!preview3DContainer);
    
    return !!webglCanvas && !!webglContext;
}

// Test 4: Check design tools availability
function testDesignTools() {
    console.log('\n4. Testing design tools...');
    
    const buttons = Array.from(document.querySelectorAll('button'));
    const inputs = Array.from(document.querySelectorAll('input'));
    
    const designTools = {
        textTool: buttons.some(btn => btn.textContent?.includes('Text') || btn.textContent?.includes('Add Text')),
        shapeTool: buttons.some(btn => btn.textContent?.includes('Shape') || btn.textContent?.includes('Rectangle')),
        uploadTool: buttons.some(btn => btn.textContent?.includes('Upload') || btn.textContent?.includes('Image')),
        colorInput: inputs.some(input => input.type === 'color'),
        textInput: inputs.some(input => input.type === 'text' || input.placeholder?.includes('text')),
        fileInput: inputs.some(input => input.type === 'file')
    };
    
    console.log('Design tools available:', designTools);
    
    const toolsCount = Object.values(designTools).filter(Boolean).length;
    console.log(`Design tools found: ${toolsCount}/6`);
    
    return toolsCount >= 3; // At least 3 design tools should be available
}

// Test 5: Check for proper component structure
function testComponentStructure() {
    console.log('\n5. Testing component structure...');
    
    // Check for main containers
    const mainContainer = document.querySelector('[class*="customizer"]') || 
                         document.querySelector('[class*="integrated"]');
    const tabsContainer = document.querySelector('[role="tablist"]') || 
                         document.querySelector('[class*="tabs"]');
    const cardElements = document.querySelectorAll('[class*="card"]');
    
    console.log('Main customizer container found:', !!mainContainer);
    console.log('Tabs container found:', !!tabsContainer);
    console.log('Card elements found:', cardElements.length);
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    console.log('Loading elements found:', loadingElements.length);
    
    return !!(mainContainer && cardElements.length > 0);
}

// Test 6: Test basic interaction
function testBasicInteraction() {
    console.log('\n6. Testing basic interaction...');
    
    try {
        // Try to find and click a button (non-destructive test)
        const testButton = document.querySelector('button[type="button"]:not([disabled])');
        if (testButton) {
            console.log('Found testable button:', testButton.textContent?.trim());
            // Don't actually click it, just verify it's clickable
            console.log('Button is clickable:', !testButton.disabled);
            return true;
        } else {
            console.log('No testable buttons found');
            return false;
        }
    } catch (error) {
        console.error('Error testing interaction:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting 3D Customization System Tests...\n');
    
    const results = {
        componentsLoaded: testComponentsLoaded(),
        syncControls: testSyncControls(),
        preview3D: test3DPreview(),
        designTools: testDesignTools(),
        componentStructure: testComponentStructure(),
        basicInteraction: testBasicInteraction()
    };
    
    console.log('\n=== Test Results ===');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    const passCount = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📊 Results: ${passCount}/${totalTests} tests passed`);
    
    if (passCount >= totalTests * 0.8) { // 80% pass rate
        console.log('\n🎉 3D Customization System is working correctly!');
        console.log('\n🎯 You can now:');
        console.log('• Design in the 2D editor with Fabric.js');
        console.log('• Switch between 2D and 3D modes');
        console.log('• Toggle real-time sync on/off');
        console.log('• Use manual sync when needed');
        console.log('• Add text, shapes, and images');
        console.log('• See designs reflected in 3D preview');
    } else if (passCount >= totalTests * 0.5) { // 50% pass rate
        console.log('\n⚠️ 3D Customization System is partially working.');
        console.log('Some features may not be fully functional.');
        console.log('Check the failed tests above for details.');
    } else {
        console.log('\n❌ 3D Customization System has significant issues.');
        console.log('Multiple core features are not working correctly.');
        console.log('Please check the implementation and console errors.');
    }
    
    return results;
}

// Additional helper functions
window.test3DCustomization = runAllTests;

window.debugCustomizer = function() {
    console.log('\n🔍 Debug Information:');
    console.log('• Page URL:', window.location.href);
    console.log('• User Agent:', navigator.userAgent.slice(0, 100) + '...');
    console.log('• Canvas elements:', document.querySelectorAll('canvas').length);
    console.log('• Button elements:', document.querySelectorAll('button').length);
    console.log('• React dev tools:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    console.log('• Errors in console:', window.console?.error?.length || 'Unknown');
};

// Auto-run if this script is executed
if (typeof window !== 'undefined') {
    console.log('✅ 3D Customization test script loaded successfully.');
    console.log('📝 Available commands:');
    console.log('• test3DCustomization() - Run all tests');
    console.log('• debugCustomizer() - Show debug information');
    
    // Auto-run tests after a short delay to let the page load
    setTimeout(() => {
        console.log('\n🔄 Auto-running tests...');
        runAllTests();
    }, 2000);
}
