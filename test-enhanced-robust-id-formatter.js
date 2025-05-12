// Test script for the ultra-robust CJ product ID formatter
// Run with: node test-enhanced-robust-id-formatter.js

// This is a much more robust approach that extracts the numeric part
// regardless of complex prefix/suffix patterns

console.log("Testing Ultra-Robust CJ Product ID Formatter");
console.log("==============================================");

// Test cases with specific focus on the problematic case
const testIds = [
    { id: "2505120302191615200", description: "Numeric only" },
    { id: "pid:2505120302191615200", description: "Standard prefix" },
    { id: "pid:2505120302191615200:null", description: "Complete format" },
    { id: "pid:pid:2505120302191615200:null", description: "Double-prefix problem case" },
    { id: "pid:pid:2505120302191615200", description: "Double-prefix without null" },
    // More complex edge cases:
    { id: "foo:pid:2505120302191615200:bar", description: "Complex pattern with text" },
    { id: "something-pid:pid:2505120302191615200:null-else", description: "Very complex with hyphens" },
    { id: "2505120302191615200:somethingelse", description: "Numeric with complex suffix" }
];

// Ultra-robust formatter - extract the numeric part using regex
function robustFormatProductId(pid) {
    console.log(`\nOriginal product ID: "${pid}"`);

    // First priority: Extract the numeric part using regex pattern
    // This is the most robust approach that will work regardless of format
    const numericMatch = pid.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
        const numericPart = numericMatch[1];
        const formattedId = `pid:${numericPart}:null`;
        console.log(`Extracted numeric part and formatted ID to: ${formattedId}`);
        return formattedId;
    }
    
    // If somehow no numeric part was found, return the original
    console.log(`No numeric part found, returning original: ${pid}`);
    return pid;
}

// Route handler's ID cleaning logic
function cleanProductIdBeforeAPICall(productId) {
    console.log(`\nRoute cleaning - Original ID: "${productId}"`);
    
    // Extract the numeric part of the product ID using regex
    const numericMatch = productId.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
        const numericPart = numericMatch[1];
        // Always format consistently as pid:NUMBER:null
        const cleanedProductId = `pid:${numericPart}:null`;
        console.log(`Extracted numeric part and formatted ID: ${cleanedProductId}`);
        return cleanedProductId;
    }
    
    // If no numeric part found, return original
    console.log(`No numeric part found, returning original: ${productId}`);
    return productId;
}

// Test each ID format
console.log("\n===== TESTING CLIENT robustFormatProductId METHOD =====");
testIds.forEach(test => {
    console.log(`\nTesting ${test.description}: "${test.id}"`);
    const result = robustFormatProductId(test.id);
    console.log(`Final result: "${result}"`);
});

console.log("\n\n===== TESTING IMPORT ROUTE CLEANING LOGIC =====");
testIds.forEach(test => {
    console.log(`\nTesting ${test.description}: "${test.id}"`);
    const result = cleanProductIdBeforeAPICall(test.id);
    console.log(`Final result: "${result}"`);
});

console.log("\n\n===== SIMULATING COMPLETE FLOW =====");
testIds.forEach(test => {
    console.log(`\nTesting complete flow for ${test.description}: "${test.id}"`);
    
    // First, clean the ID as the route would
    const routeCleaned = cleanProductIdBeforeAPICall(test.id);
    console.log(`After route cleaning: "${routeCleaned}"`);
    
    // Then, format the ID as the client would
    const clientFormatted = robustFormatProductId(routeCleaned);
    console.log(`After client formatting: "${clientFormatted}"`);
    
    // Check if the final result is in the expected format
    const isCorrectFormat = /^pid:\d+:null$/.test(clientFormatted);
    console.log(`Final format is ${isCorrectFormat ? 'CORRECT ✅' : 'INCORRECT ❌'}: "${clientFormatted}"`);
});
