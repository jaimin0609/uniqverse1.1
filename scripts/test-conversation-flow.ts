import fetch from 'node-fetch';

interface ChatResponse {
    message: string;
    responseType?: string;
}

async function testConversationFlow() {
    console.log("🧪 Testing the specific conversation flow you mentioned...\n");

    const testMessages = [
        "limited edition",
        "can you find a best product to gift my wife",
        "i am shopping for my wife",
        "i am looking for something like dress"
    ];

    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];

        console.log(`\n${i + 1}. User: "${message}"`);
        console.log("⏳ Processing...");

        try {
            const response = await fetch('http://localhost:3000/api/ai-chat-personalized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: `test-conversation-${Date.now()}`,
                    conversationHistory: []
                })
            });
            const data = await response.json() as ChatResponse;

            console.log(`🤖 Assistant: "${data.message}"`);
            console.log(`📊 Type: ${data.responseType || 'unknown'}`);

            // Brief pause between messages
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.log(`❌ Error: ${error}`);
        }
    }

    console.log("\n✅ Conversation flow test completed!");
}

testConversationFlow();
