import { db } from "@/lib/db";

// Test file to verify the chatbot models are working
async function testChatbotModels() {
    try {
        console.log("Testing chatbot models...");

        // Test ChatbotConversation
        const conversations = await db.chatbotConversation.findMany({
            take: 1
        });
        console.log("ChatbotConversation works:", conversations.length >= 0);

        // Test ChatbotMessage
        const messages = await db.chatbotMessage.findMany({
            take: 1
        });
        console.log("ChatbotMessage works:", messages.length >= 0);

        // Test ChatbotLearning
        const learning = await db.chatbotLearning.findMany({
            take: 1
        });
        console.log("ChatbotLearning works:", learning.length >= 0);

        // Test WebsiteContext
        const context = await db.websiteContext.findMany({
            take: 1
        });
        console.log("WebsiteContext works:", context.length >= 0);

        // Test ChatbotAnalytics
        const analytics = await db.chatbotAnalytics.findMany({
            take: 1
        });
        console.log("ChatbotAnalytics works:", analytics.length >= 0);

        // Test ChatbotFeedback
        const feedback = await db.chatbotFeedback.findMany({
            take: 1
        });
        console.log("ChatbotFeedback works:", feedback.length >= 0);

        console.log("All models are accessible!");
        return true;

    } catch (error) {
        console.error("Error testing models:", error);
        return false;
    }
}

export default testChatbotModels;
