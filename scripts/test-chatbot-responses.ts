#!/usr/bin/env node
/**
 * Test script to verify UniQVerse chatbot behavior
 * This tests both pattern matching and OpenAI responses
 * Ensures chatbot stays focused on UniQVerse topics
 */

interface TestCase {
    message: string;
    expectedType: 'pattern' | 'openai' | 'reject';
    description: string;
    expectsRedirect?: boolean;
}

const TEST_CASES: TestCase[] = [
    // Pattern-based responses (should use trained patterns)
    {
        message: "What are your shipping costs?",
        expectedType: 'pattern',
        description: "Shipping info - should match pattern"
    },
    {
        message: "How do I return an item?",
        expectedType: 'pattern',
        description: "Return policy - should match pattern"
    },
    {
        message: "What payment methods do you accept?",
        expectedType: 'pattern',
        description: "Payment info - should match pattern"
    },
    {
        message: "Hi there",
        expectedType: 'pattern',
        description: "Greeting - should match pattern"
    },

    // UniQVerse-related queries that should use OpenAI (no exact pattern match)
    {
        message: "I'm looking for unique birthday gifts for my sister who loves sustainable products",
        expectedType: 'openai',
        description: "Product recommendation - should use OpenAI for UniQVerse products"
    },
    {
        message: "Do you have any eco-friendly tech gadgets in stock?",
        expectedType: 'openai',
        description: "Specific product inquiry - should use OpenAI"
    },
    {
        message: "What makes UniQVerse different from other e-commerce sites?",
        expectedType: 'openai',
        description: "Company info - should use OpenAI for UniQVerse topics"
    },

    // Unrelated queries (should be redirected/rejected)
    {
        message: "What's the weather like today?",
        expectedType: 'reject',
        description: "Weather question - should redirect to UniQVerse",
        expectsRedirect: true
    },
    {
        message: "Can you help me with my math homework?",
        expectedType: 'reject',
        description: "Homework help - should redirect to UniQVerse",
        expectsRedirect: true
    },
    {
        message: "What's the latest news?",
        expectedType: 'reject',
        description: "News question - should redirect to UniQVerse",
        expectsRedirect: true
    },
    {
        message: "How do I cook pasta?",
        expectedType: 'reject',
        description: "Cooking question - should redirect to UniQVerse",
        expectsRedirect: true
    }
];

async function testChatbotResponse(testCase: TestCase): Promise<{
    success: boolean;
    actualResponse: string;
    responseType?: string;
    error?: string;
}> {
    try {
        console.log(`\n🧪 Testing: "${testCase.message}"`);
        console.log(`📋 Expected: ${testCase.description}`);

        const response = await fetch('http://localhost:3000/api/ai-chat-personalized', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: testCase.message,
                sessionId: `test-session-${Date.now()}`,
                conversationHistory: []
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const actualResponse = data.message;
        const responseType = data.responseType;

        console.log(`🤖 Response: "${actualResponse}"`);
        console.log(`📊 Type: ${responseType || 'unknown'}`);

        // Check if response matches expectations
        let success = false;

        if (testCase.expectedType === 'pattern') {
            success = responseType === 'pattern';
        } else if (testCase.expectedType === 'openai') {
            success = responseType === 'openai' && !containsRedirectPhrase(actualResponse);
        } else if (testCase.expectedType === 'reject') {
            success = containsRedirectPhrase(actualResponse);
        }

        console.log(`✅ Result: ${success ? 'PASS' : 'FAIL'}`);

        return {
            success,
            actualResponse,
            responseType
        };

    } catch (error) {
        console.log(`❌ Error: ${error}`);
        return {
            success: false,
            actualResponse: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

function containsRedirectPhrase(response: string): boolean {
    const redirectPhrases = [
        "designed specifically to help with UniQVerse",
        "designed to help with UniQVerse shopping and services",
        "I'm here to help with UniQVerse",
        "assist you with our products or website",
        "assist you with finding products, orders, or navigating our website"
    ];

    const lowerResponse = response.toLowerCase();
    return redirectPhrases.some(phrase =>
        lowerResponse.includes(phrase.toLowerCase())
    );
}

async function runAllTests(): Promise<void> {
    console.log('🚀 Starting UniQVerse Chatbot Response Tests');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    const results: Array<{
        testCase: TestCase;
        result: any;
    }> = [];

    for (const testCase of TEST_CASES) {
        const result = await testChatbotResponse(testCase);
        results.push({ testCase, result });

        if (result.success) {
            passCount++;
        } else {
            failCount++;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

    // Detailed failure analysis
    if (failCount > 0) {
        console.log('\n🔍 FAILED TESTS ANALYSIS:');
        console.log('-'.repeat(40));

        results.forEach(({ testCase, result }, index) => {
            if (!result.success) {
                console.log(`\n${index + 1}. ${testCase.description}`);
                console.log(`   Message: "${testCase.message}"`);
                console.log(`   Expected: ${testCase.expectedType}`);
                console.log(`   Got: ${result.responseType || 'error'}`);
                console.log(`   Response: "${result.actualResponse}"`);
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
            }
        });
    }

    console.log('\n🎯 TESTING GUIDELINES:');
    console.log('- Pattern responses should handle common, exact queries');
    console.log('- OpenAI responses should be for UniQVerse-specific complex queries');
    console.log('- All unrelated queries should be politely redirected');
    console.log('- Test both authenticated and guest user flows');
}

// Run the tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

export { runAllTests, TEST_CASES };
