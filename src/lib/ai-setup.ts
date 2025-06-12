import { db } from "@/lib/db";

// AI Chatbot Setup and Enhancement Script
export async function setupEnhancedAI() {
    console.log("🤖 Setting up Enhanced AI Chatbot System...");

    try {
        // 1. Initialize default website context
        await initializeWebsiteContext();

        // 2. Create default patterns
        await createDefaultPatterns();

        // 3. Create fallback responses
        await createFallbackResponses();

        // 4. Initialize analytics
        await initializeAnalytics();

        console.log("✅ Enhanced AI Chatbot setup completed successfully!");

        return {
            success: true,
            message: "AI Chatbot enhanced with self-learning capabilities"
        };

    } catch (error) {
        console.error("❌ Setup failed:", error);
        throw error;
    }
}

async function initializeWebsiteContext() {
    console.log("📖 Initializing website context...");

    const defaultContexts = [
        {
            page: '/shipping',
            title: 'Shipping Information',
            content: `UniQVerse offers multiple shipping options: Standard Shipping (3-5 business days, free over $50), Express Shipping (2-3 business days, $9.99), and Next Day Delivery (next business day, $19.99). We ship internationally to most countries with delivery times of 7-14 business days. All orders are processed within 24 hours on business days. You can track your order through your account or using the tracking link in your shipping confirmation email.`,
            keywords: ['shipping', 'delivery', 'tracking', 'international', 'express', 'standard'],
            category: 'shipping'
        },
        {
            page: '/returns',
            title: 'Returns & Exchanges',
            content: `Our return policy allows returns within 30 days of delivery. Items must be unused, in original packaging, and in the same condition you received them. To initiate a return, log into your account and go to your orders, or contact our support team. Refunds are processed within 5-7 business days after we receive and inspect the returned item. Personalized or custom items cannot be returned unless defective. Return shipping costs are the customer's responsibility unless the item is defective.`,
            keywords: ['returns', 'refund', 'exchange', 'policy', 'defective', 'unused'],
            category: 'returns'
        },
        {
            page: '/payment',
            title: 'Payment Methods',
            content: `UniQVerse accepts all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All transactions are secured with industry-standard encryption and SSL certificates. We do not store your payment information on our servers. For payment issues or failed transactions, please contact our support team. We also accept gift cards and store credit.`,
            keywords: ['payment', 'credit card', 'paypal', 'apple pay', 'google pay', 'secure'],
            category: 'payment'
        },
        {
            page: '/account',
            title: 'Account Management',
            content: `Create an account to track orders, save favorites, and speed up checkout. To register, click 'Account' in the top navigation and select 'Register'. You can reset your password through the login page using 'Forgot Password'. Your account dashboard shows order history, shipping addresses, payment methods, and personal information. You can update your information anytime or contact support to delete your account.`,
            keywords: ['account', 'register', 'login', 'password', 'profile', 'dashboard'],
            category: 'account'
        },
        {
            page: '/contact',
            title: 'Contact Support',
            content: `Contact UniQVerse support via email at support@uniqverse.com or phone at 1-800-555-1234. Our business hours are Monday-Friday 9:00 AM - 6:00 PM EST, and Saturday 10:00 AM - 4:00 PM EST. We're closed on Sundays and major holidays. You can also submit a support ticket through your account dashboard or use our live chat during business hours.`,
            keywords: ['contact', 'support', 'email', 'phone', 'hours', 'ticket'],
            category: 'support'
        }
    ]; for (const context of defaultContexts) {
        // Check if context exists first
        const existingContext = await db.websiteContext.findFirst({
            where: { page: context.page }
        });

        if (existingContext) {
            await db.websiteContext.update({
                where: { id: existingContext.id },
                data: context
            });
        } else {
            await db.websiteContext.create({
                data: {
                    ...context,
                    lastUpdated: new Date(),
                    isActive: true
                }
            });
        }
    }

    console.log(`✅ Initialized ${defaultContexts.length} website contexts`);
}

async function createDefaultPatterns() {
    console.log("🎯 Creating default response patterns...");

    const patterns = [
        {
            response: "Hello! I'm here to help you with any questions about UniQVerse. You can ask me about orders, shipping, returns, products, or account issues. What would you like to know?",
            priority: 20,
            triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'help']
        },
        {
            response: "You can track your order by logging into your account and viewing your order history, or use the tracking link in your shipping confirmation email. If you need your tracking number, please provide your order number and I'll help you find it.",
            priority: 15,
            triggers: ['track order', 'tracking', 'where is my order', 'order status', 'shipping status']
        },
        {
            response: "Our return policy allows returns within 30 days of delivery. Items must be unused and in original packaging. You can initiate a return through your account or contact our support team at support@uniqverse.com. Would you like specific instructions for returning an item?",
            priority: 15,
            triggers: ['return', 'refund', 'exchange', 'send back', 'return policy']
        },
        {
            response: "We offer Standard Shipping (3-5 days, free over $50), Express Shipping (2-3 days, $9.99), and Next Day Delivery ($19.99). International shipping is available to most countries (7-14 days). Which shipping option would you like to know more about?",
            priority: 15,
            triggers: ['shipping options', 'how long shipping', 'shipping cost', 'delivery time', 'international shipping']
        },
        {
            response: "You can contact our support team at support@uniqverse.com or call 1-800-555-1234. Our hours are Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST. You can also submit a support ticket through your account dashboard.",
            priority: 10,
            triggers: ['contact support', 'phone number', 'email support', 'customer service', 'help desk']
        }
    ];

    for (const pattern of patterns) {
        const createdPattern = await db.chatbotPattern.create({
            data: {
                response: pattern.response,
                priority: pattern.priority,
                isActive: true
            }
        });

        // Create triggers
        for (const trigger of pattern.triggers) {
            await db.chatbotTrigger.create({
                data: {
                    phrase: trigger.toLowerCase(),
                    patternId: createdPattern.id
                }
            });
        }
    }

    console.log(`✅ Created ${patterns.length} response patterns`);
}

async function createFallbackResponses() {
    console.log("🔄 Creating fallback responses...");

    const fallbacks = [
        "I'm not sure I understand that question. Could you please rephrase it or ask about orders, shipping, returns, or account issues?",
        "I'd like to help, but I need more information. Can you tell me more about what you're looking for?",
        "That's a great question! For detailed assistance with that topic, I'd recommend contacting our support team at support@uniqverse.com or 1-800-555-1234.",
        "I'm still learning about that topic. In the meantime, you can find more information in our help center or contact support directly.",
        "I want to make sure I give you accurate information. Could you be more specific about what you need help with?"
    ];

    for (const response of fallbacks) {
        await db.chatbotFallback.create({
            data: { response }
        });
    }

    console.log(`✅ Created ${fallbacks.length} fallback responses`);
}

async function initializeAnalytics() {
    console.log("📊 Initializing analytics system...");

    // Create initial analytics entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.chatbotAnalytics.upsert({
        where: { date: today },
        update: {},
        create: {
            date: today,
            totalConversations: 0,
            totalMessages: 0,
            avgSatisfaction: null,
            escalationRate: null,
            resolutionRate: null,
            avgResponseTime: null,
            topTopics: [],
            unmatchedQueries: 0
        }
    });

    console.log("✅ Analytics system initialized");
}

// Continuous improvement functions
export async function runContinuousLearning() {
    console.log("🧠 Running continuous learning cycle...");

    try {
        // Run all continuous learning processes
        const response = await fetch('/api/ai-continuous-learning', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Continuous learning completed:", data.message);
            return data;
        } else {
            throw new Error('Continuous learning failed');
        }
    } catch (error) {
        console.error("❌ Continuous learning error:", error);
        throw error;
    }
}

export async function crawlWebsiteContent() {
    console.log("🕷️ Crawling website for updated content...");

    try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        const response = await fetch('/api/ai-crawler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'crawl_sitemap',
                data: { baseUrl }
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Website crawling completed:", data.message);
            return data;
        } else {
            throw new Error('Website crawling failed');
        }
    } catch (error) {
        console.error("❌ Website crawling error:", error);
        throw error;
    }
}

// Export for use in admin dashboard
export const aiSetupUtils = {
    setupEnhancedAI,
    runContinuousLearning,
    crawlWebsiteContent
};
