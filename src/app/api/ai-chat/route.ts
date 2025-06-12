import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { knowledgeBase } from "@/lib/support-knowledge-base";
import OpenAI from "openai";
import { Currency } from "@/contexts/currency-provider";

// Currency utilities
function getExchangeRate(targetCurrency: Currency): number {
    const fallbackRates: Record<string, number> = {
        USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.51, CAD: 1.36, JPY: 154.35
    };
    return fallbackRates[targetCurrency] || 1;
}

function convertCurrency(amountInUSD: number, targetCurrency: Currency): number {
    const rate = getExchangeRate(targetCurrency);
    const converted = amountInUSD * rate;
    return targetCurrency === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;
}

function formatCurrency(amount: number, currencyCode: Currency): string {
    const symbols: Record<string, string> = {
        USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥"
    };
    const symbol = symbols[currencyCode] || "$";

    if (currencyCode === "JPY") {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

interface ConversationContext {
    sessionId: string;
    userId?: string;
    messages: ChatMessage[];
    topics: string[];
    userIntent?: string;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    let conversationId: string | null = null;
    let requestMessages: ChatMessage[] = [];

    try {
        const {
            messages,
            sessionId,
            userContext,
            currency = "USD"
        } = await req.json();

        requestMessages = messages; // Store for error handling

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({
                error: "Messages array is required"
            }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || null;
        const lastUserMessage = messages[messages.length - 1];

        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            return NextResponse.json({
                error: "Last message must be from user"
            }, { status: 400 });
        }

        // Create or get conversation
        conversationId = await getOrCreateConversation(sessionId, userId, req);

        // Extract topics and analyze intent
        const context = await analyzeConversationContext(messages, userContext);        // Generate response using hybrid AI approach
        const response = await generateHybridResponse(
            lastUserMessage.content,
            messages,
            context,
            currency as Currency
        );// Store conversation data for learning
        const messageIds = await storeConversationData(
            conversationId,
            lastUserMessage.content,
            response.content,
            response.patternMatched,
            response.confidence,
            Date.now() - startTime
        );

        // Update conversation statistics
        await updateConversationStats(conversationId, context.topics);

        return NextResponse.json({
            message: response.content,
            confidence: response.confidence,
            patternMatched: response.patternMatched,
            suggestions: response.suggestions,
            conversationId,
            messageId: messageIds.botMessageId, // Include the bot message ID for rating
            userMessageId: messageIds.userMessageId,
            processingTime: Date.now() - startTime
        });

    } catch (error: any) {
        console.error("Enhanced AI Chat error:", error);        // Log learning data for failed queries
        if (conversationId && requestMessages && requestMessages.length > 0) {
            await logUnmatchedQuery(
                conversationId,
                requestMessages[requestMessages.length - 1]?.content || "",
                error.message
            );
        }

        return NextResponse.json({
            message: "I apologize, but I'm experiencing technical difficulties. Please try asking your question in a different way, or contact our support team for immediate assistance.",
            error: "processing_error"
        }, { status: 500 });
    }
}

async function getOrCreateConversation(
    sessionId: string,
    userId: string | null,
    req: NextRequest
): Promise<string> {
    try {
        // Try to find existing conversation
        let conversation = await db.chatbotConversation.findFirst({
            where: { sessionId },
            orderBy: { startedAt: 'desc' }
        });

        if (!conversation) {
            // Create new conversation
            const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
            const userAgent = req.headers.get('user-agent') || 'unknown';

            conversation = await db.chatbotConversation.create({
                data: {
                    sessionId,
                    userId,
                    ipAddress: clientIP,
                    userAgent,
                    startedAt: new Date()
                }
            });
        }

        return conversation.id;
    } catch (error) {
        console.error("Error managing conversation:", error);
        throw error;
    }
}

async function analyzeConversationContext(
    messages: ChatMessage[],
    userContext?: any
): Promise<ConversationContext> {
    const topics: string[] = [];
    let userIntent: string | undefined;

    // Extract topics from recent messages
    const recentMessages = messages.slice(-5); // Last 5 messages
    const conversationText = recentMessages
        .map(m => m.content)
        .join(' ')
        .toLowerCase();    // Identify topics based on keywords
    const topicKeywords = {
        'product_search': ['gift', 'present', 'buy', 'shopping', 'find', 'looking', 'recommend', 'wife', 'husband', 'mother', 'father'],
        'shipping': ['ship', 'delivery', 'shipping', 'deliver', 'tracking', 'arrived'],
        'returns': ['return', 'refund', 'exchange', 'send back', 'defective'],
        'orders': ['order', 'purchase', 'buy', 'cart', 'checkout', 'payment'],
        'account': ['account', 'login', 'password', 'register', 'profile'],
        'products': ['product', 'item', 'size', 'color', 'availability', 'stock'],
        'technical': ['error', 'bug', 'not working', 'broken', 'issue', 'problem'],
        'pricing': ['price', 'cost', 'discount', 'coupon', 'sale', 'promotion']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => conversationText.includes(keyword))) {
            topics.push(topic);
        }
    }

    // Determine user intent using simple classification
    if (conversationText.includes('help') || conversationText.includes('?')) {
        userIntent = 'seeking_help';
    } else if (conversationText.includes('complaint') || conversationText.includes('problem')) {
        userIntent = 'complaint';
    } else if (conversationText.includes('thank') || conversationText.includes('thanks')) {
        userIntent = 'gratitude';
    }

    return {
        sessionId: userContext?.sessionId || 'unknown',
        userId: userContext?.userId,
        messages,
        topics: topics.length > 0 ? topics : ['general'],
        userIntent
    };
}

async function generateHybridResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: ConversationContext,
    currency: Currency = "USD"
): Promise<{
    content: string;
    confidence: number;
    patternMatched?: string;
    suggestions?: string[];
}> {
    // Load configuration to use confidence threshold
    const config = await getChatbotConfig();
    const confidenceThreshold = config.confidence_threshold || 0.75;    // First, try rule-based patterns
    const ruleBasedResponse = await tryRuleBasedResponse(userMessage, context, currency);

    if (ruleBasedResponse.confidence > 0.7) {
        return ruleBasedResponse;
    }

    // If rule-based confidence is low, try AI enhancement
    if (process.env.OPENAI_API_KEY) {
        try {
            const aiResponse = await tryAIResponse(userMessage, conversationHistory, context);

            // Use configured confidence threshold to decide whether to use AI response
            if (aiResponse.confidence >= confidenceThreshold) {
                return aiResponse;
            }

            // Combine rule-based and AI responses if both have some confidence
            if (ruleBasedResponse.confidence > 0.3 && aiResponse.confidence > 0.5) {
                return {
                    content: aiResponse.content,
                    confidence: Math.max(ruleBasedResponse.confidence, aiResponse.confidence),
                    patternMatched: ruleBasedResponse.patternMatched,
                    suggestions: aiResponse.suggestions
                };
            }

            // If AI confidence is below threshold, prefer rule-based if it has decent confidence
            if (ruleBasedResponse.confidence > 0.4) {
                return ruleBasedResponse;
            }

            return aiResponse;
        } catch (aiError) {
            console.warn("AI response failed, falling back to rule-based:", aiError);
        }
    }

    // Fallback to rule-based response
    return ruleBasedResponse;
}

async function tryRuleBasedResponse(
    message: string,
    context: ConversationContext,
    currency: Currency = "USD"
): Promise<{
    content: string;
    confidence: number;
    patternMatched?: string;
    suggestions?: string[];
}> {
    try {
        const lowerMessage = message.toLowerCase();
        const keywords = extractKeywords(lowerMessage);        // Check if this is a product search query FIRST
        const productSearchResponse = await tryProductSearch(message, lowerMessage, keywords, currency);
        if (productSearchResponse.confidence > 0.5) { // Lowered threshold
            return productSearchResponse;
        }

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

            // Direct phrase matching
            const directMatch = triggerPhrases.some(phrase =>
                lowerMessage.includes(phrase)
            );
            if (directMatch) score += 10;

            // Keyword matching
            const patternKeywords = triggerPhrases.flatMap(phrase =>
                extractKeywords(phrase)
            );
            const keywordMatches = keywords.filter(kw =>
                patternKeywords.includes(kw)
            ).length;
            score += keywordMatches * 2;

            // Context bonus (if pattern relates to current conversation topics)
            if (context.topics.some(topic =>
                pattern.response.toLowerCase().includes(topic) ||
                triggerPhrases.some(phrase => phrase.includes(topic))
            )) {
                score += 3;
            }

            if (score > 0) {
                patternScores.push({ pattern, score });
            }
        }

        // Sort by score
        patternScores.sort((a, b) => b.score - a.score);

        if (patternScores.length > 0) {
            const bestMatch = patternScores[0];
            const confidence = Math.min(bestMatch.score / 15, 1); // Normalize to 0-1

            return {
                content: bestMatch.pattern.response,
                confidence,
                patternMatched: bestMatch.pattern.id,
                suggestions: generateSuggestions(context.topics)
            };
        }

        // Fallback response
        const fallbacks = await db.chatbotFallback.findMany();
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        return {
            content: randomFallback?.response || "I'm not sure how to help with that. Could you please rephrase your question?",
            confidence: 0.2,
            suggestions: generateSuggestions(context.topics)
        };

    } catch (error) {
        console.error("Rule-based response error:", error);
        return {
            content: "I'm having trouble processing your request. Please try again or contact support.",
            confidence: 0.1
        };
    }
}

async function tryAIResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: ConversationContext
): Promise<{
    content: string;
    confidence: number;
    suggestions?: string[];
}> {
    try {
        // Load chatbot configuration from database
        const config = await getChatbotConfig();

        // Build enhanced context for AI
        const websiteContext = await getWebsiteContext(context.topics, userMessage);
        const recentLearnings = await getRecentLearnings(userMessage);
        const similarQuestions = await getSimilarQuestions(userMessage);

        const systemPrompt = `You are an AI customer support assistant for ${config.chatbot_name || 'Uniqverse'}, an e-commerce platform. 

COMPANY INFO:
- Name: Uniqverse
- Email: support@uniqverse.com  
- Phone: 1-800-555-1234
- Hours: Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST

WEBSITE CONTEXT:
${websiteContext}

RECENT LEARNINGS:
${recentLearnings}

SIMILAR QUESTIONS ANSWERED:
${similarQuestions}

CONVERSATION TOPICS: ${context.topics.join(', ')}

IMPORTANT GUIDELINES:
1. Always use the most specific information from the website context
2. Be helpful, friendly, and professional
3. Keep responses concise but complete
4. Use the company information provided above
5. If you don't have specific information, say so and offer to connect them with support
6. Always offer to help with anything else at the end
7. Use markdown formatting for links: [text](url)
8. If the website context contains exact information for their question, use it verbatim
9. For product questions, always mention checking the product page for latest info
10. For order questions, suggest they check their account or contact support with order number

Respond naturally as if you're part of the ${config.chatbot_name || 'Uniqverse'} support team.`;

        // Limit conversation history based on configuration
        const maxHistoryLength = Math.min(config.max_conversation_length || 50, 8);
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...conversationHistory.slice(-maxHistoryLength),
        ];

        const completion = await openai.chat.completions.create({
            model: config.openai_model || "gpt-3.5-turbo",
            messages,
            max_tokens: config.max_response_tokens || 500,
            temperature: config.response_temperature || 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });

        const content = completion.choices[0]?.message?.content || "";

        // Calculate confidence based on multiple factors
        let confidence = 0.6;

        // Boost confidence if we have relevant website context
        if (websiteContext && websiteContext.length > 100) {
            confidence += 0.2;
        }

        // Boost confidence if we found similar questions
        if (similarQuestions && similarQuestions.length > 0) {
            confidence += 0.1;
        }

        // Boost confidence if response is substantial
        if (content.length > 100) {
            confidence += 0.1;
        }

        // Cap confidence at 0.95
        confidence = Math.min(confidence, 0.95);

        return {
            content,
            confidence,
            suggestions: generateSuggestions(context.topics)
        };

    } catch (error) {
        console.error("AI response error:", error);
        throw error;
    }
}

async function getWebsiteContext(topics: string[], userMessage?: string): Promise<string> {
    try {
        // Enhanced context retrieval with keyword matching
        let contexts = await db.websiteContext.findMany({
            where: {
                OR: [
                    { category: { in: topics } },
                    { keywords: { hasSome: topics } }
                ],
                isActive: true
            },
            take: 5,
            orderBy: { lastUpdated: 'desc' }
        });

        // If we have user message, try to find more specific context
        if (userMessage && contexts.length < 3) {
            const messageKeywords = extractKeywords(userMessage.toLowerCase());

            const additionalContexts = await db.websiteContext.findMany({
                where: {
                    AND: [
                        { isActive: true },
                        {
                            OR: [
                                { keywords: { hasSome: messageKeywords } },
                                { content: { contains: messageKeywords[0], mode: 'insensitive' } },
                                { title: { contains: messageKeywords[0], mode: 'insensitive' } }
                            ]
                        }
                    ]
                },
                take: 3,
                orderBy: { lastUpdated: 'desc' }
            });

            // Merge and deduplicate
            const allContexts = [...contexts, ...additionalContexts];
            contexts = allContexts.filter((ctx, index, arr) =>
                arr.findIndex(c => c.id === ctx.id) === index
            ).slice(0, 4);
        }

        if (contexts.length === 0) {
            return "Website context unavailable.";
        }

        return contexts.map(ctx => {
            // Truncate content smartly at sentence boundaries
            let content = ctx.content;
            if (content.length > 300) {
                const truncated = content.substring(0, 300);
                const lastSentence = truncated.lastIndexOf('. ');
                content = lastSentence > 200 ? truncated.substring(0, lastSentence + 1) : truncated + '...';
            }
            return `[${ctx.category.toUpperCase()}] ${ctx.title}:\n${content}`;
        }).join('\n\n');
    } catch (error) {
        console.error("Error fetching website context:", error);
        return "Website context unavailable.";
    }
}

async function getRecentLearnings(userMessage: string): Promise<string> {
    try {
        // Get recent learning data that might be relevant
        const messageKeywords = extractKeywords(userMessage.toLowerCase());

        const learnings = await db.chatbotLearning.findMany({
            where: {
                status: 'implemented',
                OR: [
                    { userMessage: { contains: userMessage.substring(0, 20), mode: 'insensitive' } },
                    { expectedResponse: { contains: messageKeywords[0], mode: 'insensitive' } }
                ]
            },
            take: 3,
            orderBy: { lastOccurred: 'desc' }
        });

        if (learnings.length === 0) {
            return "";
        }

        return learnings.map(l =>
            `Q: "${l.userMessage}"\nA: "${l.expectedResponse}"`
        ).join('\n\n');
    } catch (error) {
        console.error("Error fetching learnings:", error);
        return "";
    }
}

async function getSimilarQuestions(userMessage: string): Promise<string> {
    try {
        const messageKeywords = extractKeywords(userMessage.toLowerCase());

        // Find conversations with high satisfaction that had similar keywords
        const similarConversations = await db.chatbotConversation.findMany({
            where: {
                satisfactionRating: { gte: 4 },
                tags: { hasSome: messageKeywords.slice(0, 3) },
                startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            include: {
                messages: {
                    take: 4,
                    orderBy: { timestamp: 'asc' }
                }
            },
            take: 2
        });

        if (similarConversations.length === 0) {
            return "";
        }

        return similarConversations.map(conv => {
            const userMsg = conv.messages.find(m => m.role === 'user');
            const botMsg = conv.messages.find(m => m.role === 'assistant');
            if (userMsg && botMsg) {
                return `Q: "${userMsg.content}"\nA: "${botMsg.content}"`;
            }
            return "";
        }).filter(Boolean).join('\n\n');
    } catch (error) {
        console.error("Error fetching similar questions:", error);
        return "";
    }
}

function generateSuggestions(topics: string[]): string[] {
    const suggestionMap: Record<string, string[]> = {
        'shipping': [
            "Track my order",
            "Shipping costs and times",
            "International shipping"
        ],
        'returns': [
            "How to return an item",
            "Refund policy",
            "Exchange process"
        ],
        'orders': [
            "Check order status",
            "Modify my order",
            "Payment issues"
        ],
        'account': [
            "Reset my password",
            "Update account info",
            "Delete account"
        ]
    };

    const suggestions: string[] = [];
    topics.forEach(topic => {
        if (suggestionMap[topic]) {
            suggestions.push(...suggestionMap[topic]);
        }
    });

    return suggestions.slice(0, 3); // Return max 3 suggestions
}

async function storeConversationData(
    conversationId: string,
    userMessage: string,
    botResponse: string,
    patternMatched?: string,
    confidence?: number,
    processingTime?: number
): Promise<{ userMessageId: string; botMessageId: string }> {
    try {
        // Store user message
        const userMsg = await db.chatbotMessage.create({
            data: {
                conversationId,
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            }
        });

        // Store bot response
        const botMsg = await db.chatbotMessage.create({
            data: {
                conversationId,
                role: 'assistant',
                content: botResponse,
                timestamp: new Date(),
                patternMatched,
                confidence,
                processingTime
            }
        });

        // Update conversation stats
        await db.chatbotConversation.update({
            where: { id: conversationId },
            data: {
                totalMessages: { increment: 2 },
                endedAt: new Date()
            }
        });

        return {
            userMessageId: userMsg.id,
            botMessageId: botMsg.id
        };

    } catch (error) {
        console.error("Error storing conversation data:", error);
        throw error;
    }
}

async function updateConversationStats(
    conversationId: string,
    topics: string[]
): Promise<void> {
    try {
        await db.chatbotConversation.update({
            where: { id: conversationId },
            data: {
                tags: topics
            }
        });
    } catch (error) {
        console.error("Error updating conversation stats:", error);
    }
}

async function logUnmatchedQuery(
    conversationId: string,
    userMessage: string,
    errorMessage: string
): Promise<void> {
    try {
        // Check if similar unmatched query exists
        const existing = await db.chatbotLearning.findFirst({
            where: {
                userMessage: { contains: userMessage.substring(0, 30) },
                status: 'pending'
            }
        });

        if (existing) {
            // Increment frequency
            await db.chatbotLearning.update({
                where: { id: existing.id },
                data: {
                    frequency: { increment: 1 },
                    lastOccurred: new Date()
                }
            });
        } else {
            // Create new learning entry
            await db.chatbotLearning.create({
                data: {
                    userMessage,
                    frequency: 1,
                    status: 'pending',
                    lastOccurred: new Date()
                }
            });
        }
    } catch (error) {
        console.error("Error logging unmatched query:", error);
    }
}

// Product Search Integration
async function tryProductSearch(
    originalMessage: string,
    lowerMessage: string,
    keywords: string[],
    currency: Currency = "USD"
): Promise<{
    content: string;
    confidence: number;
    patternMatched?: string;
    suggestions?: string[];
}> {
    try {
        // Load configuration to check if product search is enabled
        const config = await getChatbotConfig();

        if (!config.enable_product_search) {
            return { content: "", confidence: 0 };
        }

        // Product search intent patterns with scoring
        const productSearchPatterns = [
            { patterns: ['gift', 'gifts', 'present'], weight: 10 },
            { patterns: ['wife', 'husband', 'girlfriend', 'boyfriend'], weight: 8 },
            { patterns: ['anniversary', 'birthday', 'christmas', 'valentine'], weight: 8 },
            { patterns: ['find', 'looking for', 'can you find', 'help me find'], weight: 7 },
            { patterns: ['product', 'products', 'best product', 'best products'], weight: 7 },
            { patterns: ['recommend', 'recommendation', 'suggest', 'suggestion'], weight: 6 },
            { patterns: ['buy', 'shopping', 'shop', 'purchase'], weight: 5 },
            { patterns: ['best', 'top', 'popular'], weight: 4 },
            { patterns: ['men', 'women', 'male', 'female', 'him', 'her'], weight: 3 }
        ];

        // Calculate product search intent score
        let productSearchScore = 0;
        for (const patternGroup of productSearchPatterns) {
            const matches = patternGroup.patterns.filter(pattern =>
                lowerMessage.includes(pattern)
            );
            productSearchScore += matches.length * patternGroup.weight;
        }

        // If score is too low, this is not a product search
        if (productSearchScore < 6) {
            return { content: "", confidence: 0 };
        }

        // Call the product search API with configured limits
        const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai-product-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: originalMessage,
                maxResults: config.product_search_limit || 6
            }),
        });

        if (!searchResponse.ok) {
            throw new Error('Product search API failed');
        }

        const searchData = await searchResponse.json(); if (searchData.success && searchData.products && searchData.products.length > 0) {
            // Format product recommendations with thumbnails
            const maxProducts = Math.min(searchData.products.length, config.product_search_limit || 6);
            const products = searchData.products.slice(0, maxProducts);            // Create HTML formatted product cards with optional images
            let productCards = products.map(product => {
                const productUrl = `/products/${product.slug}`;
                const imageUrl = product.image || '/placeholder-product.jpg';

                // Convert prices to selected currency
                const convertedPrice = convertCurrency(product.price, currency);
                const formattedPrice = formatCurrency(convertedPrice, currency);

                const originalPrice = product.compareAtPrice
                    ? `<span style="text-decoration: line-through; color: #888;">${formatCurrency(convertCurrency(product.compareAtPrice, currency), currency)}</span> `
                    : '';

                // Show image only if enabled in configuration
                const imageSection = config.show_product_images
                    ? `<img src="${imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 12px;" />`
                    : '';

                return `
<div style="display: flex; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; background: #f9fafb;">
    ${imageSection}
    <div style="flex: 1;">
        <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937;">
            <a href="${productUrl}" style="color: #2563eb; text-decoration: none;">${product.name}</a>
        </h4>
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${product.category}</p>
        <p style="margin: 0; color: #059669; font-weight: bold;">
            ${originalPrice}${formattedPrice}
        </p>
        ${product.rating > 0 ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #f59e0b;">★ ${product.rating} (${product.reviewCount} reviews)</p>` : ''}
    </div>
</div>`.trim();
            }).join('\n');

            const response = `${searchData.recommendations.message}

Here are some great options I found:

${productCards}

You can [browse all products](/shop) or [view specific categories](/shop) to see more options.`;

            return {
                content: response,
                confidence: Math.min(0.75 + (productSearchScore / 100), 0.95), // Higher confidence for product search
                patternMatched: "product_search",
                suggestions: [
                    "Tell me more about these products",
                    "Show me different price ranges",
                    "Find products in specific categories",
                    "Help me narrow down choices"
                ]
            };
        } else if (config.fallback_products && searchData.fallbackProducts && searchData.fallbackProducts.length > 0) {
            // Handle fallback products with enhanced messaging
            const maxFallbackProducts = Math.min(searchData.fallbackProducts.length, config.product_search_limit || 6);
            const fallbackProducts = searchData.fallbackProducts.slice(0, maxFallbackProducts); let fallbackCards = fallbackProducts.map(product => {
                const productUrl = `/products/${product.slug}`;
                const imageUrl = product.image || '/placeholder-product.jpg';

                // Convert prices to selected currency
                const convertedPrice = convertCurrency(product.price, currency);
                const formattedPrice = formatCurrency(convertedPrice, currency);

                const originalPrice = product.compareAtPrice
                    ? `<span style="text-decoration: line-through; color: #888;">${formatCurrency(convertCurrency(product.compareAtPrice, currency), currency)}</span> `
                    : '';

                // Show image only if enabled in configuration
                const imageSection = config.show_product_images
                    ? `<img src="${imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 12px;" />`
                    : '';

                return `
<div style="display: flex; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; background: #f9fafb;">
    ${imageSection}
    <div style="flex: 1;">
        <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937;">
            <a href="${productUrl}" style="color: #2563eb; text-decoration: none;">${product.name}</a>
        </h4>
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${product.category}</p>
        <p style="margin: 0; color: #059669; font-weight: bold;">
            ${originalPrice}${formattedPrice}
        </p>
        ${product.rating > 0 ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #f59e0b;">★ ${product.rating} (${product.reviewCount} reviews)</p>` : ''}
    </div>
</div>`.trim();
            }).join('\n');

            const fallbackMessage = searchData.fallbackMessage || "I couldn't find exact matches for your search, but here are some similar products you might like:";

            const response = `${fallbackMessage}

${fallbackCards}

💡 **Try these search tips:**
- Use different keywords (e.g., "shirt" instead of "top")
- Try broader categories (e.g., "clothing" instead of "formal wear")
- Search by occasion (e.g., "wedding", "casual", "work")

You can also [browse all products](/shop) or [contact our support team](mailto:support@uniqverse.com) for personalized recommendations!`;

            return {
                content: response,
                confidence: 0.65, // Good confidence for fallback
                patternMatched: "product_search_fallback",
                suggestions: [
                    "Try different search terms",
                    "Browse by category",
                    "Show me popular products",
                    "Help with gift ideas"
                ]
            };
        } else {
            // No products found at all - enhanced with search tips
            const searchTips = [
                "Try broader terms (e.g., 'clothing' instead of 'vintage denim jacket')",
                "Use different keywords (e.g., 'sneakers' instead of 'athletic footwear')",
                "Search by occasion (e.g., 'wedding', 'party', 'casual', 'work')",
                "Try category names (e.g., 'electronics', 'home decor', 'beauty')",
                "Look for gift ideas (e.g., 'gifts for mom', 'anniversary presents')"
            ];

            const randomTips = searchTips.sort(() => 0.5 - Math.random()).slice(0, 3);

            return {
                content: `I'd love to help you find the perfect products! While I couldn't find matches for your specific search, here are some tips to help you find what you're looking for:

🔍 **Search Tips:**
${randomTips.map(tip => `• ${tip}`).join('\n')}

🛍️ **Quick Options:**
• [Browse all products](/shop) to see our full collection
• [View popular categories](/shop) like Clothing, Electronics, and Home & Garden
• [Check out our featured products](/shop) for trending items

Need personalized help? [Contact our support team](mailto:support@uniqverse.com) and we'll help you find exactly what you need!`,
                confidence: 0.6,
                patternMatched: "product_search_no_results",
                suggestions: [
                    "Browse all products",
                    "Show me popular categories",
                    "Help me with gift ideas",
                    "Contact support for help"
                ]
            };
        }

    } catch (error) {
        console.error("Product search error:", error);
        return { content: "", confidence: 0 };
    }
}

function extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/);

    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'by',
        'of', 'from', 'up', 'down', 'that', 'this', 'these', 'those', 'them', 'they',
        'their', 'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his',
        'she', 'her', 'hers', 'it', 'its', 'do', 'does', 'did', 'have', 'has', 'had',
        'would', 'could', 'should'];

    return words.filter(word => word.length > 2 && !stopWords.includes(word));
}

// Feedback endpoint
export async function PUT(req: NextRequest) {
    try {
        const { conversationId, messageId, rating, comment, feedbackType } = await req.json();

        if (!conversationId || !rating) {
            return NextResponse.json({
                error: "conversationId and rating are required"
            }, { status: 400 });
        }

        await db.chatbotFeedback.create({
            data: {
                conversationId,
                messageId,
                rating,
                comment,
                feedbackType,
                createdAt: new Date()
            }
        });

        // Update conversation satisfaction if overall feedback
        if (!messageId) {
            await db.chatbotConversation.update({
                where: { id: conversationId },
                data: { satisfactionRating: rating }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Feedback error:", error);
        return NextResponse.json({
            error: "Failed to process feedback"
        }, { status: 500 });
    }
}

// Load chatbot configuration from database
async function getChatbotConfig(): Promise<{
    openai_model: string;
    response_temperature: number;
    max_response_tokens: number;
    confidence_threshold: number;
    product_search_limit: number;
    fuzzy_search_tolerance: number;
    enable_product_search: boolean;
    show_product_images: boolean;
    fallback_products: boolean;
    enable_smart_rating: boolean;
    track_user_interactions: boolean;
    enable_feedback_buttons: boolean;
    enable_learning: boolean;
    track_unmatched: boolean;
    chatbot_name: string;
    welcome_message: string;
    max_conversation_length: number;
    session_timeout_minutes: number;
    chatbot_color: string;
    chat_window_size: string;
    chatbot_position: string;
}> {
    try {
        // Get settings from database
        const settings = await db.siteSettings.findMany({
            where: {
                key: {
                    startsWith: 'chatbot_'
                }
            }
        });

        // Convert settings array to object
        const config: any = {};
        settings.forEach(setting => {
            const key = setting.key.replace('chatbot_', '');
            let value: any = setting.value;

            // Parse boolean and number values
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value)) && value !== '') value = Number(value);

            config[key] = value;
        });

        // Set defaults for missing values
        const defaultConfig = {
            openai_model: 'gpt-3.5-turbo',
            response_temperature: 0.7,
            max_response_tokens: 500,
            confidence_threshold: 0.75,
            product_search_limit: 6,
            fuzzy_search_tolerance: 0.6,
            enable_product_search: true,
            show_product_images: true,
            fallback_products: true,
            enable_smart_rating: true,
            track_user_interactions: true,
            enable_feedback_buttons: true,
            enable_learning: true,
            track_unmatched: true,
            chatbot_name: 'UniQVerse AI Support',
            welcome_message: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more.',
            max_conversation_length: 50,
            session_timeout_minutes: 30,
            chatbot_color: 'blue',
            chat_window_size: 'medium',
            chatbot_position: 'bottom-right'
        };

        return { ...defaultConfig, ...config };

    } catch (error) {
        console.error("Error loading chatbot configuration:", error);
        // Return defaults on error
        return {
            openai_model: 'gpt-3.5-turbo',
            response_temperature: 0.7,
            max_response_tokens: 500,
            confidence_threshold: 0.75,
            product_search_limit: 6,
            fuzzy_search_tolerance: 0.6,
            enable_product_search: true,
            show_product_images: true,
            fallback_products: true,
            enable_smart_rating: true,
            track_user_interactions: true,
            enable_feedback_buttons: true,
            enable_learning: true,
            track_unmatched: true,
            chatbot_name: 'UniQVerse AI Support',
            welcome_message: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more.',
            max_conversation_length: 50,
            session_timeout_minutes: 30,
            chatbot_color: 'blue',
            chat_window_size: 'medium',
            chatbot_position: 'bottom-right'
        };
    }
}
