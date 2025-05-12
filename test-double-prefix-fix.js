// Test script to verify product ID handling
// Run with: node test-double-prefix-fix.js

// Test product IDs in various formats
const testIds = [
    '2505120336561605600',                  // Just the numeric ID
    'pid:2505120336561605600',              // With prefix
    'pid:2505120336561605600:null',         // With prefix and suffix
    'pid:pid:2505120336561605600:null',     // Double-prefixed (error case)
];

// Test encoding functions
console.log("====== TESTING ENCODING FUNCTIONS ======");
testIds.forEach(id => {
    console.log(`\nOriginal ID: "${id}"`);
    
    // Standard encodeURIComponent
    const encoded = encodeURIComponent(id);
    console.log(`encodeURIComponent: "${encoded}"`);

    // Extract numeric part only (potential fix)
    const numericMatch = id.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
        const numericOnly = numericMatch[1];
        console.log(`Numeric part only: "${numericOnly}"`);
    }
});

// Test URL formatting as done in the API client
console.log("\n\n====== TESTING URL FORMATION ======");
testIds.forEach(id => {
    console.log(`\nOriginal ID: "${id}"`);
    
    // Current code - format then encode
    const formattedId = formatProductId(id);
    console.log(`After formatting: "${formattedId}"`);
    
    const endpoint1 = `v1/product/query?pid=${encodeURIComponent(formattedId)}`;
    console.log(`URL with encoded formatted ID: "${endpoint1}"`);
    
    // Potential fix - extract numeric part after formatting
    const numericMatch = formattedId.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
        const numericOnly = numericMatch[1];
        const endpoint2 = `v1/product/query?pid=${numericOnly}`;
        console.log(`URL with numeric part only: "${endpoint2}"`);
    }
});

// Simulate the API's handling of the encoded parameter
console.log("\n\n====== SIMULATING API PROCESSING ======");
testIds.forEach(id => {
    console.log(`\nOriginal ID: "${id}"`);
    
    // Current code path
    const formattedId = formatProductId(id);
    const endpoint = `v1/product/query?pid=${encodeURIComponent(formattedId)}`;
    
    // Simulate URL decoding on server side
    const serverReceived = decodeURIComponent(endpoint.split('=')[1]);
    console.log(`API would receive: "${serverReceived}"`);
    
    // Simulate the API possibly adding a prefix (if it's assuming numeric IDs only)
    if (!serverReceived.startsWith('pid:')) {
        console.log(`API might convert to: "pid:${serverReceived}"`);
    } else {
        console.log(`API likely keeps as is: "${serverReceived}"`);
    }
});

// Utility function to format product IDs (simplified version from the codebase)
function formatProductId(pid) {
    // First priority: Extract the numeric part using regex pattern
    const numericMatch = pid.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
        const numericPart = numericMatch[1];
        return `pid:${numericPart}:null`;
    }
    
    // Check for double-prefixed IDs like "pid:pid:NUMBER:null" 
    if (pid.startsWith('pid:pid:')) {
        const parts = pid.split(':');
        if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
            return `pid:${parts[2]}:null`;
        }
    } else if (pid.startsWith('pid:')) {
        const parts = pid.split(':');
        if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
            return `pid:${parts[1]}:null`;
        }
    }
    
    // If it's already in the expected format, keep it as is
    if (/^pid:\d+:null$/.test(pid)) {
        return pid;
    }
    
    // If it's in the format "pid:number", add ":null"
    if (/^pid:\d+$/.test(pid)) {
        return `${pid}:null`;
    }
    
    // If it's just a number, add the prefix and suffix
    if (/^\d+$/.test(pid)) {
        return `pid:${pid}:null`;
    }
    
    // For other formats, try to extract the numeric part and reformat
    let numericPart = pid;
    if (pid.includes(':')) {
        const parts = pid.split(':');
        const numericParts = parts.filter(part => /^\d+$/.test(part));
        if (numericParts.length > 0) {
            numericPart = numericParts[0];
        }
    }
    
    return `pid:${numericPart}:null`;
}
