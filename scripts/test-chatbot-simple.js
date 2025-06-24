const TEST_QUERIES = [
    // Should use trained patterns
    { 
        message: "What are your shipping costs?", 
        expected: "pattern",
        description: "Shipping info" 
    },
    { 
        message: "How do I return an item?", 
        expected: "pattern",
        description: "Return policy" 
    },
    { 
        message: "Hello", 
        expected: "pattern",
        description: "Greeting" 
    },
    
    // Should use OpenAI for UniQVerse topics
    { 
        message: "I need unique eco-friendly gifts for my friend", 
        expected: "openai",
        description: "Product recommendation" 
    },
    { 
        message: "What makes UniQVerse special compared to other stores?", 
        expected: "openai",
        description: "Company differentiation" 
    },
    
    // Should redirect (reject) unrelated topics
    { 
        message: "What's the weather today?", 
        expected: "redirect",
        description: "Weather question" 
    },
    { 
        message: "Can you help me with my homework?", 
        expected: "redirect",
        description: "Homework help" 
    },
    { 
        message: "What's 2+2?", 
        expected: "redirect",
        description: "Math question" 
    }
];

async function testQuery(query) {
    try {
        const response = await fetch('http://localhost:3000/api/ai-chat-personalized', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: query.message,
                sessionId: `test-${Date.now()}`,
                conversationHistory: []
            })
        });

        const data = await response.json();
        
        console.log(`\n📝 Query: "${query.message}"`);
        console.log(`🎯 Expected: ${query.expected} (${query.description})`);
        console.log(`🤖 Response: "${data.message}"`);
        console.log(`📊 Type: ${data.responseType || 'unknown'}`);
        
        // Check if response contains redirect phrases
        const redirectPhrases = [
            "designed specifically to help with UniQVerse",
            "designed to help with UniQVerse shopping and services",
            "assist you with our products or website"
        ];
        
        const hasRedirect = redirectPhrases.some(phrase => 
            data.message.toLowerCase().includes(phrase.toLowerCase())
        );
        
        let result = 'UNKNOWN';
        if (data.responseType === 'pattern') result = 'PATTERN ✅';
        else if (data.responseType === 'openai' && !hasRedirect) result = 'OPENAI ✅';
        else if (hasRedirect) result = 'REDIRECT ✅';
        else result = 'UNEXPECTED ❌';
        
        console.log(`✨ Result: ${result}`);
        console.log('-'.repeat(50));
        
        return result.includes('✅');
        
    } catch (error) {
        console.log(`❌ Error testing "${query.message}": ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Testing UniQVerse Chatbot Responses');
    console.log('='.repeat(50));
    
    let passed = 0;
    let total = TEST_QUERIES.length;
    
    for (const query of TEST_QUERIES) {
        const success = await testQuery(query);
        if (success) passed++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    console.log('\n💡 HOW TO TEST:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Run this script: node scripts/test-chatbot-simple.js');
    console.log('3. Also test manually in the UI at http://localhost:3000');
    
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    console.log('- Pattern: Common queries use trained responses');
    console.log('- OpenAI: Complex UniQVerse queries use AI');
    console.log('- Redirect: Unrelated topics get politely redirected');
}

// Add helper for manual testing
console.log('💬 MANUAL TEST QUERIES:');
console.log('Try these in your chatbot UI:');
console.log('');
console.log('SHOULD USE PATTERNS:');
console.log('- "What are your shipping costs?"');
console.log('- "How do I return something?"');
console.log('- "Hello"');
console.log('');
console.log('SHOULD USE OPENAI (UniQVerse topics):');
console.log('- "I need eco-friendly gifts for my sister"');
console.log('- "What makes UniQVerse different from Amazon?"');
console.log('');
console.log('SHOULD REDIRECT (unrelated):');
console.log('- "What\'s the weather?"');
console.log('- "Help me with math homework"');
console.log('- "What\'s in the news?"');
console.log('');

// Run if called directly
if (typeof window === 'undefined' && require.main === module) {
    runTests().catch(console.error);
}
