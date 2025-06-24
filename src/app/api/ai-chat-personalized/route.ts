import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

interface PersonalizedChatRequest {
    message: string;
    sessionId: string;
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
}

interface UserOrderInfo {
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    items: Array<{
        name: string;
        quantity: number;
    }>;
}

export async function POST(req: NextRequest) {
    try {
        const { message, sessionId, conversationHistory = [] }: PersonalizedChatRequest = await req.json();

        // Get authenticated user session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            // Handle non-authenticated users with generic responses
            return handleGuestUser(message, sessionId, conversationHistory);
        }

        const user = session.user;
        const userId = user.id;        // Analyze user intent and extract relevant information
        const intent = await analyzeUserIntent(message, conversationHistory);

        let response: string;
        let actions: string[] = [];
        let confidence: number = 0;
        let patternMatched: string | undefined;

        // First, try to match against database patterns (trained responses)
        const patternResponse = await tryPatternMatch(message);

        if (patternResponse.confidence > 0.7) {
            // Use pattern-based response if confidence is high
            response = patternResponse.content;
            confidence = patternResponse.confidence;
            patternMatched = patternResponse.patternId;
        } else {
            // Use intent-based personalized responses
            switch (intent.type) {
                case 'GREETING':
                    response = await handleGreeting(user.name || user.email || "there");
                    break;

                case 'ORDER_INQUIRY':
                    if (intent.orderNumber) {
                        response = await handleOrderInquiry(userId, intent.orderNumber);
                    } else {
                        response = "I'd be happy to help you check your order status! Could you please provide your order number? You can find it in your email confirmation or in your account under 'My Orders'.";
                        actions = ['request_order_number'];
                    }
                    break;

                case 'ACCOUNT_INFO':
                    response = await handleAccountInquiry(userId, intent.infoType || 'general');
                    break;

                case 'GENERAL_SUPPORT':
                    // If pattern matching had some confidence, use it, otherwise use AI
                    if (patternResponse.confidence > 0.3) {
                        response = patternResponse.content;
                        confidence = patternResponse.confidence;
                        patternMatched = patternResponse.patternId;
                    } else {
                        response = await handleGeneralSupport(message, user.name);
                    }
                    break;

                default:
                    // Fallback to pattern or AI
                    if (patternResponse.confidence > 0.3) {
                        response = patternResponse.content;
                        confidence = patternResponse.confidence;
                        patternMatched = patternResponse.patternId;
                    } else {
                        response = await handleGeneralSupport(message, user.name);
                    }
            }
        }

        // Store conversation for learning
        await storePersonalizedConversation(userId, sessionId, message, response, intent.type); return NextResponse.json({
            success: true,
            message: response,
            actions,
            userAuthenticated: true,
            userName: user.name || user.email,
            confidence,
            patternMatched
        });

    } catch (error) {
        console.error("Personalized chat error:", error);
        return NextResponse.json({
            success: false,
            error: "I'm experiencing technical difficulties. Please try again or contact support."
        }, { status: 500 });
    }
}

async function handleGuestUser(message: string, sessionId: string, history: any[]) {
    const response = await generateGenericResponse(message, history);

    return NextResponse.json({
        success: true,
        message: response,
        userAuthenticated: false,
        suggestion: "Log in to get personalized assistance with your orders and account!"
    });
}

async function handleGreeting(userName: string): Promise<string> {
    const greetings = [
        `Hi ${userName}! 👋 Welcome back to UniQVerse! How can I help you today?`,
        `Hello ${userName}! 🌟 Great to see you again! What can I assist you with?`,
        `Hey ${userName}! 😊 I'm here to help with any questions about your orders, products, or account. What's on your mind?`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
}

async function handleOrderInquiry(userId: string, orderNumber: string): Promise<string> {
    try {
        // Security check: Only allow users to access their own orders
        const order = await db.order.findFirst({
            where: {
                AND: [
                    { orderNumber: orderNumber },
                    { userId: userId } // Critical: Only user's own orders
                ]
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return `I couldn't find an order with number ${orderNumber} in your account. Please double-check the order number, or contact support if you need help locating your order.`;
        }

        let response = `📦 **Order ${orderNumber}** Status: **${order.status}**\n\n`;

        // Add order details        response += `**Items ordered:**\n`;
        order.items.forEach(item => {
            response += `• ${item.product.name} (Quantity: ${item.quantity})\n`;
        });

        response += `\n**Order Date:** ${order.createdAt.toLocaleDateString()}\n`;
        response += `**Total:** $${order.total.toFixed(2)}\n`;        // Add status-specific information
        switch (order.status) {
            case 'PENDING':
                response += `\n⏳ Your order is being processed and will ship within 1-2 business days.`;
                break;
            case 'PROCESSING':
                response += `\n🔄 Your order is currently being prepared for shipment.`;
                break;
            case 'SHIPPED':
                if (order.trackingNumber) {
                    response += `\n🚚 **Shipped!** Tracking Number: **${order.trackingNumber}**`;
                    response += `\nYou can track your package [here](https://www.ups.com/track?tracknum=${order.trackingNumber}) or in your account.`;
                } else {
                    response += `\n🚚 Your order has been shipped! You should receive tracking information shortly.`;
                }
                break;
            case 'DELIVERED':
                response += `\n✅ **Delivered!** Your order was successfully delivered.`;
                break;
            case 'COMPLETED':
                response += `\n✅ **Completed!** Your order has been successfully completed.`;
                break;
            case 'CANCELLED':
                response += `\n❌ This order was cancelled.`;
                if (order.cancelledAt) {
                    response += ` on ${order.cancelledAt.toLocaleDateString()}`;
                }
                break;
            case 'REFUNDED':
                response += `\n💰 This order has been refunded.`;
                break;
            case 'ON_HOLD':
                response += `\n⏸️ Your order is currently on hold. Our team will contact you shortly.`;
                break;
        }

        response += `\n\nNeed to make changes or have questions? I'm here to help! 😊`;

        return response;

    } catch (error) {
        console.error("Order inquiry error:", error);
        return "I'm having trouble accessing your order information right now. Please try again or contact our support team for immediate assistance.";
    }
}

async function handleAccountInquiry(userId: string, infoType: string): Promise<string> {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                addresses: true,
                orders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        orderNumber: true,
                        status: true,
                        total: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!user) {
            return "I'm having trouble accessing your account information. Please try logging in again.";
        }

        switch (infoType) {
            case 'recent_orders':
                if (user.orders.length === 0) {
                    return "You haven't placed any orders yet. Ready to find something amazing? Check out our [featured products](/shop)! 🛍️";
                }

                let ordersResponse = "📋 **Your Recent Orders:**\n\n";
                user.orders.forEach(order => {
                    ordersResponse += `• Order ${order.orderNumber} - ${order.status} - $${order.total.toFixed(2)} (${order.createdAt.toLocaleDateString()})\n`;
                });
                ordersResponse += `\nWant details on any specific order? Just give me the order number! 😊`;
                return ordersResponse;

            case 'addresses':
                if (user.addresses.length === 0) {
                    return "You don't have any saved addresses yet. You can add them in your [account settings](/account/addresses) for faster checkout! 📍";
                } let addressResponse = "📍 **Your Saved Addresses:**\n\n";
                user.addresses.forEach((addr, index) => {
                    addressResponse += `${index + 1}. ${addr.address1}, ${addr.city}, ${addr.state} ${addr.postalCode}\n`;
                });
                return addressResponse;

            default:
                return `Hi ${user.name || 'there'}! Your account is active and ready to go. What specific information would you like to know about your account? 😊`;
        }

    } catch (error) {
        console.error("Account inquiry error:", error);
        return "I'm having trouble accessing your account information right now. Please try again or contact support.";
    }
}

async function handleGeneralSupport(message: string, userName?: string): Promise<string> {
    try {
        // Use OpenAI to generate personalized response
        const systemPrompt = `You are a helpful UniQVerse customer support AI assistant. ${userName ? `The customer's name is ${userName}.` : ''} 
        
        UniQVerse is an e-commerce platform specializing in unique, high-quality products including:
        - Artisan crafts and handmade items
        - Tech innovations and gadgets  
        - Sustainable lifestyle products
        - Fashion-forward accessories
        
        Key policies:
        - Free shipping on orders over $50
        - 30-day return policy
        - Customer service: support@uniqverse.com
        - Phone: 1-800-555-1234
        
        Be friendly, helpful, and use the customer's name when appropriate. Keep responses concise but informative.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        return completion.choices[0]?.message?.content || "I'm here to help! What can I assist you with today?";

    } catch (error) {
        console.error("General support error:", error);
        const fallback = userName
            ? `Hi ${userName}! I'm here to help with any questions about UniQVerse. What can I assist you with today?`
            : "I'm here to help with any questions about UniQVerse. What can I assist you with today?";
        return fallback;
    }
}

async function analyzeUserIntent(message: string, history: any[]): Promise<{
    type: string;
    orderNumber?: string;
    infoType?: string;
    confidence: number;
}> {
    const messageLower = message.toLowerCase();

    // Greeting detection
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(messageLower)) {
        return { type: 'GREETING', confidence: 0.9 };
    }

    // Order inquiry detection
    if (/\b(order|track|tracking|shipped|delivery|package)\b/.test(messageLower)) {
        // Extract order number if present
        const orderNumberMatch = message.match(/\b([A-Z]{2}\d{6,}|\d{8,})\b/);
        return {
            type: 'ORDER_INQUIRY',
            orderNumber: orderNumberMatch?.[1],
            confidence: 0.8
        };
    }

    // Account info detection
    if (/\b(account|profile|address|orders|my orders|recent orders)\b/.test(messageLower)) {
        let infoType = 'general';
        if (/\b(orders|my orders|recent orders)\b/.test(messageLower)) infoType = 'recent_orders';
        if (/\b(address|addresses)\b/.test(messageLower)) infoType = 'addresses';

        return {
            type: 'ACCOUNT_INFO',
            infoType,
            confidence: 0.8
        };
    }

    return { type: 'GENERAL_SUPPORT', confidence: 0.6 };
}

async function generateGenericResponse(message: string, history: any[]): Promise<string> {
    try {
        const systemPrompt = `You are a helpful UniQVerse customer support AI assistant for guests (not logged in users).
        
        UniQVerse is an e-commerce platform with unique products. Be helpful but remind them that logging in provides personalized assistance with orders and account information.
        
        Keep responses friendly and concise.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        return completion.choices[0]?.message?.content || "I'm here to help! For personalized assistance with orders and account information, please log in to your account.";

    } catch (error) {
        return "I'm here to help! For personalized assistance with orders and account information, please log in to your account.";
    }
}

async function storePersonalizedConversation(
    userId: string,
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    intentType: string
) {
    try {
        // First find or create conversation
        let conversation = await db.chatbotConversation.findFirst({
            where: { sessionId }
        });

        if (!conversation) {
            conversation = await db.chatbotConversation.create({
                data: {
                    sessionId,
                    userId,
                    totalMessages: 0
                }
            });
        }

        // Add user message
        await db.chatbotMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: userMessage,
                context: { intentType }
            }
        });

        // Add assistant message
        await db.chatbotMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: assistantMessage,
                context: { intentType }
            }
        });

        // Update conversation message count
        await db.chatbotConversation.update({
            where: { id: conversation.id },
            data: {
                totalMessages: { increment: 2 }
            }
        });

    } catch (error) {
        console.error("Failed to store conversation:", error);
        // Don't throw - this is non-critical
    }
}

async function tryPatternMatch(message: string): Promise<{
    content: string;
    confidence: number;
    patternId?: string;
}> {
    try {
        const lowerMessage = message.toLowerCase();
        const keywords = extractKeywords(lowerMessage);

        // Get patterns from database
        const dbPatterns = await db.chatbotPattern.findMany({
            include: { triggers: true },
            where: { isActive: true },
            orderBy: { priority: 'asc' }
        });

        const patternScores: Array<{
            pattern: any;
            score: number;
        }> = [];

        // Score patterns
        for (const pattern of dbPatterns) {
            let score = 0;
            const triggerPhrases = pattern.triggers.map(t => t.phrase.toLowerCase());

            // Direct phrase matching (exact match gets highest score)
            const exactMatch = triggerPhrases.some(phrase =>
                lowerMessage === phrase ||
                lowerMessage.includes(phrase)
            );
            if (exactMatch) score += 15;

            // Partial phrase matching
            const partialMatch = triggerPhrases.some(phrase =>
                phrase.split(' ').some(word => lowerMessage.includes(word))
            );
            if (partialMatch) score += 5;

            // Keyword matching
            const patternKeywords = triggerPhrases.flatMap(phrase =>
                extractKeywords(phrase)
            );
            const keywordMatches = keywords.filter(kw =>
                patternKeywords.includes(kw)
            ).length;
            score += keywordMatches * 3;

            if (score > 0) {
                patternScores.push({ pattern, score });
            }
        }

        // Sort by score (highest first)
        patternScores.sort((a, b) => b.score - a.score);

        if (patternScores.length > 0) {
            const bestMatch = patternScores[0];
            const confidence = Math.min(bestMatch.score / 20, 1); // Normalize to 0-1

            return {
                content: bestMatch.pattern.response,
                confidence,
                patternId: bestMatch.pattern.id
            };
        }

        // No pattern match found
        return {
            content: "",
            confidence: 0
        };

    } catch (error) {
        console.error("Pattern matching error:", error);
        return {
            content: "",
            confidence: 0
        };
    }
}

function extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cant', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
}
