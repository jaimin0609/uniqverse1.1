import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

// Continuous Learning API - Runs periodically to improve the AI
export async function POST(req: NextRequest) {
    try {
        const { action, data } = await req.json();

        switch (action) {
            case 'analyze_conversations':
                return await analyzeRecentConversations();
            case 'generate_patterns':
                return await generatePatternsFromSuccessfulConversations();
            case 'update_context':
                return await updateContextFromFeedback();
            case 'optimize_responses':
                return await optimizeExistingResponses();
            default:
                return NextResponse.json({
                    error: "Invalid action"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("Continuous learning error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function analyzeRecentConversations() {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get conversations with mixed feedback
        const conversations = await db.chatbotConversation.findMany({
            where: {
                startedAt: { gte: sevenDaysAgo },
                OR: [
                    { satisfactionRating: { gte: 4 } },
                    { satisfactionRating: { lte: 2 } }
                ]
            },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                },
                feedback: true
            }
        });

        let improvementSuggestions = 0;
        let newPatterns = 0;

        for (const conversation of conversations) {
            const messages = conversation.messages;

            // Analyze conversation flow
            for (let i = 0; i < messages.length - 1; i++) {
                const userMsg = messages[i];
                const botMsg = messages[i + 1];

                if (userMsg.role === 'user' && botMsg.role === 'assistant') {                    // For high satisfaction conversations, create learning entries
                    if (conversation.satisfactionRating && conversation.satisfactionRating >= 4) {
                        // Check if similar learning entry exists
                        const existingLearning = await db.chatbotLearning.findFirst({
                            where: {
                                userMessage: userMsg.content
                            }
                        });

                        if (existingLearning) {
                            await db.chatbotLearning.update({
                                where: { id: existingLearning.id },
                                data: {
                                    frequency: { increment: 1 },
                                    lastOccurred: new Date(),
                                    expectedResponse: botMsg.content
                                }
                            });
                        } else {
                            await db.chatbotLearning.create({
                                data: {
                                    userMessage: userMsg.content,
                                    expectedResponse: botMsg.content,
                                    frequency: 1,
                                    status: 'pending'
                                }
                            });
                        }
                        newPatterns++;
                    }                    // For low satisfaction, mark for improvement
                    if (conversation.satisfactionRating && conversation.satisfactionRating <= 2 &&
                        botMsg.confidence && botMsg.confidence < 0.7) {

                        const existingLearning = await db.chatbotLearning.findFirst({
                            where: { userMessage: userMsg.content }
                        });

                        if (existingLearning) {
                            await db.chatbotLearning.update({
                                where: { id: existingLearning.id },
                                data: {
                                    frequency: { increment: 1 },
                                    lastOccurred: new Date()
                                }
                            });
                        } else {
                            await db.chatbotLearning.create({
                                data: {
                                    userMessage: userMsg.content,
                                    frequency: 1,
                                    status: 'needs_improvement'
                                }
                            });
                        }
                        improvementSuggestions++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Analyzed ${conversations.length} conversations`,
            newPatterns,
            improvementSuggestions
        });

    } catch (error) {
        console.error("Conversation analysis error:", error);
        throw error;
    }
}

async function generatePatternsFromSuccessfulConversations() {
    try {
        // Get high-frequency, successful learning entries
        const successfulLearnings = await db.chatbotLearning.findMany({
            where: {
                status: 'pending',
                frequency: { gte: 3 },
                expectedResponse: { not: null }
            },
            orderBy: { frequency: 'desc' },
            take: 10
        });

        let patternsCreated = 0;

        for (const learning of successfulLearnings) {
            if (!learning.expectedResponse) continue;

            try {
                // Use AI to generate variations of the user question
                const variations = await generateQuestionVariations(learning.userMessage);

                // Create pattern
                const pattern = await db.chatbotPattern.create({
                    data: {
                        response: learning.expectedResponse,
                        priority: Math.min(learning.frequency * 2, 20),
                        isActive: true
                    }
                });

                // Create triggers for the original question and variations
                const triggers = [
                    learning.userMessage,
                    ...variations
                ];

                await db.chatbotTrigger.createMany({
                    data: triggers.map(trigger => ({
                        phrase: trigger.toLowerCase(),
                        patternId: pattern.id
                    }))
                });

                // Mark as implemented
                await db.chatbotLearning.update({
                    where: { id: learning.id },
                    data: { status: 'implemented' }
                });

                patternsCreated++;

            } catch (error) {
                console.error(`Error creating pattern for learning ${learning.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${patternsCreated} patterns from successful conversations`,
            patternsCreated
        });

    } catch (error) {
        console.error("Pattern generation error:", error);
        throw error;
    }
}

async function generateQuestionVariations(originalQuestion: string): Promise<string[]> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a customer service expert. Generate 3-5 different ways customers might ask the same question. Keep them natural and conversational. Return only the variations, one per line."
                },
                {
                    role: "user",
                    content: `Generate variations of this customer question: "${originalQuestion}"`
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const variations = completion.choices[0]?.message?.content?.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 5 && !line.startsWith('-'))
            .slice(0, 5) || [];

        return variations;

    } catch (error) {
        console.error("Question variation generation error:", error);
        return [];
    }
}

async function updateContextFromFeedback() {
    try {
        // Get recent negative feedback
        const negativeFeedback = await db.chatbotFeedback.findMany({
            where: {
                rating: { lte: 2 },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                comment: { not: null }
            },
            include: {
                conversation: {
                    include: {
                        messages: {
                            orderBy: { timestamp: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        });

        let contextUpdates = 0;

        for (const feedback of negativeFeedback) {
            if (!feedback.comment) continue;

            // Extract topics from negative feedback
            const topics = extractTopicsFromFeedback(feedback.comment);

            if (topics.length > 0) {
                // Find relevant website context that might need updating
                const relevantContexts = await db.websiteContext.findMany({
                    where: {
                        OR: [
                            { category: { in: topics } },
                            { keywords: { hasSome: topics } }
                        ]
                    }
                });

                // If we have context but users are still unsatisfied, flag for review
                if (relevantContexts.length > 0) {
                    for (const context of relevantContexts) {
                        // Create a learning entry to suggest context improvement
                        const contextLearningMsg = `Context update needed: ${context.title}`;
                        const existingLearning = await db.chatbotLearning.findFirst({
                            where: { userMessage: contextLearningMsg }
                        });

                        if (existingLearning) {
                            await db.chatbotLearning.update({
                                where: { id: existingLearning.id },
                                data: {
                                    frequency: { increment: 1 },
                                    lastOccurred: new Date()
                                }
                            });
                        } else {
                            await db.chatbotLearning.create({
                                data: {
                                    userMessage: contextLearningMsg,
                                    expectedResponse: `Review and update content for ${context.category}: ${feedback.comment}`,
                                    frequency: 1,
                                    status: 'context_review_needed'
                                }
                            });
                        }
                        contextUpdates++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Identified ${contextUpdates} context updates needed from feedback`,
            contextUpdates
        });

    } catch (error) {
        console.error("Context update error:", error);
        throw error;
    }
}

async function optimizeExistingResponses() {
    try {
        // Find patterns with low confidence or satisfaction
        const messages = await db.chatbotMessage.findMany({
            where: {
                role: 'assistant',
                confidence: { lt: 0.6 },
                timestamp: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
            },
            include: {
                conversation: {
                    select: { satisfactionRating: true }
                }
            }
        });

        const problematicPatterns = new Map<string, number>();

        // Count patterns that consistently get low confidence
        messages.forEach(message => {
            if (message.patternMatched) {
                const current = problematicPatterns.get(message.patternMatched) || 0;
                problematicPatterns.set(message.patternMatched, current + 1);
            }
        });

        let optimizedPatterns = 0;

        // Optimize patterns that appear frequently in low-confidence responses
        for (const [patternId, count] of problematicPatterns.entries()) {
            if (count >= 5) { // If a pattern has been used 5+ times with low confidence
                try {
                    const pattern = await db.chatbotPattern.findUnique({
                        where: { id: patternId }
                    });

                    if (pattern) {
                        // Generate an improved response using AI
                        const improvedResponse = await generateImprovedResponse(pattern.response);

                        if (improvedResponse && improvedResponse !== pattern.response) {
                            // Create a new pattern with higher priority
                            await db.chatbotPattern.create({
                                data: {
                                    response: improvedResponse,
                                    priority: pattern.priority + 5,
                                    isActive: true
                                }
                            });

                            // Lower the priority of the old pattern
                            await db.chatbotPattern.update({
                                where: { id: patternId },
                                data: { priority: Math.max(pattern.priority - 3, 1) }
                            });

                            optimizedPatterns++;
                        }
                    }
                } catch (error) {
                    console.error(`Error optimizing pattern ${patternId}:`, error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Optimized ${optimizedPatterns} response patterns`,
            optimizedPatterns
        });

    } catch (error) {
        console.error("Response optimization error:", error);
        throw error;
    }
}

async function generateImprovedResponse(originalResponse: string): Promise<string | null> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a customer service optimization expert. Improve the given customer service response to be more helpful, clear, and friendly while maintaining accuracy. Keep the same core information but make it more engaging and useful."
                },
                {
                    role: "user",
                    content: `Improve this customer service response: "${originalResponse}"`
                }
            ],
            max_tokens: 300,
            temperature: 0.3
        });

        return completion.choices[0]?.message?.content?.trim() || null;

    } catch (error) {
        console.error("Response improvement error:", error);
        return null;
    }
}

function extractTopicsFromFeedback(feedback: string): string[] {
    const topics: string[] = [];
    const lowerFeedback = feedback.toLowerCase();

    const topicKeywords = {
        'shipping': ['ship', 'delivery', 'shipping', 'deliver', 'tracking'],
        'returns': ['return', 'refund', 'exchange', 'send back'],
        'orders': ['order', 'purchase', 'buy', 'cart', 'checkout'],
        'account': ['account', 'login', 'password', 'register'],
        'products': ['product', 'item', 'size', 'color', 'availability'],
        'payment': ['payment', 'pay', 'card', 'billing', 'charge'],
        'support': ['help', 'support', 'contact', 'service']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => lowerFeedback.includes(keyword))) {
            topics.push(topic);
        }
    }

    return topics;
}

// GET endpoint to run continuous learning checks
export async function GET(req: NextRequest) {
    try {
        // This can be called by a cron job or scheduler
        const results = await Promise.allSettled([
            analyzeRecentConversations(),
            generatePatternsFromSuccessfulConversations(),
            updateContextFromFeedback(),
            optimizeExistingResponses()
        ]);

        const summary = results.map((result, index) => ({
            task: ['analyze', 'generate_patterns', 'update_context', 'optimize'][index],
            status: result.status,
            ...(result.status === 'fulfilled' ? { data: result.value } : { error: result.reason })
        }));

        return NextResponse.json({
            success: true,
            message: "Continuous learning cycle completed",
            summary
        });

    } catch (error) {
        console.error("Continuous learning GET error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}
