/**
 * Test script to verify OpenAI API connection
 */

import { config } from "dotenv";
import OpenAI from "openai";

// Load environment variables
config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
    console.log("🤖 Testing OpenAI API connection...");
    console.log("API Key found:", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");

    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY not found in environment variables");
        return;
    }

    try {
        // Test with a simple completion
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for UniQVerse e-commerce platform."
                },
                {
                    role: "user",
                    content: "Say hello and confirm you're working for UniQVerse!"
                }
            ],
            max_tokens: 100,
            temperature: 0.7
        });

        console.log("✅ OpenAI API connection successful!");
        console.log("🎯 Model used:", completion.model);
        console.log("💬 Response:", completion.choices[0]?.message?.content);
        console.log("📊 Tokens used:", completion.usage?.total_tokens);

    } catch (error: any) {
        console.error("❌ OpenAI API test failed:");

        if (error.status === 401) {
            console.error("🔑 Authentication failed - API key is invalid");
        } else if (error.status === 429) {
            console.error("⏰ Rate limit exceeded - try again later");
        } else if (error.status === 402) {
            console.error("💳 Billing issue - check your OpenAI account");
        } else {
            console.error("Error details:", error.message);
        }
    }
}

// Run the test
testOpenAI();
