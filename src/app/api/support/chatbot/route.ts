import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { knowledgeBase } from "@/lib/support-knowledge-base";

// GET - Retrieve all chatbot patterns
export async function GET() {
    try {
        // Check if chatbot models are available in Prisma client
        if (!db.chatbotPattern || !db.chatbotTrigger || !db.chatbotFallback) {
            console.warn("Chatbot models not available in Prisma client yet. Using knowledge base as fallback.");
            return NextResponse.json({
                success: true,
                data: {
                    patterns: knowledgeBase.chatPatterns.map((p, i) => ({
                        id: `static-${i}`,
                        priority: i,
                        response: p.response,
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        triggers: p.patterns.map((phrase, j) => ({
                            id: `static-trigger-${i}-${j}`,
                            phrase,
                            patternId: `static-${i}`
                        }))
                    })),
                    fallbacks: knowledgeBase.fallbackResponses.map((response, i) => ({
                        id: `static-fallback-${i}`,
                        response,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }))
                }
            });
        }

        // Fetch patterns with their triggers, ordered by priority
        const patterns = await db.chatbotPattern.findMany({
            include: {
                triggers: true,
            },
            orderBy: {
                priority: 'asc',
            },
            where: {
                isActive: true,
            }
        });

        // Fetch fallback responses
        const fallbacks = await db.chatbotFallback.findMany();

        return NextResponse.json({
            success: true,
            data: {
                patterns,
                fallbacks,
            }
        });
    } catch (error) {
        console.error("Error fetching chatbot patterns:", error);
        // Fallback to static knowledge base
        return NextResponse.json({
            success: true,
            data: {
                patterns: knowledgeBase.chatPatterns.map((p, i) => ({
                    id: `static-${i}`,
                    priority: i,
                    response: p.response,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    triggers: p.patterns.map((phrase, j) => ({
                        id: `static-trigger-${i}-${j}`,
                        phrase,
                        patternId: `static-${i}`
                    }))
                })),
                fallbacks: knowledgeBase.fallbackResponses.map((response, i) => ({
                    id: `static-fallback-${i}`,
                    response,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }))
            }
        });
    }
}

// POST - Create or update chatbot patterns
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if chatbot models are available in Prisma client
        if (!db.chatbotPattern || !db.chatbotTrigger || !db.chatbotFallback) {
            return NextResponse.json({
                success: false,
                error: "Chatbot database tables not available yet. Please restart your application server.",
                message: "The database schema has been updated but the Prisma client needs to be regenerated. Run 'npx prisma generate' and restart your server."
            }, { status: 503 });
        }

        const { chatPatterns, fallbackResponses } = await req.json();

        // Start a transaction to ensure all operations succeed or fail together
        const result = await db.$transaction(async (tx) => {
            try {
                // First, delete all existing patterns and fallbacks
                await tx.chatbotTrigger.deleteMany({});
                await tx.chatbotPattern.deleteMany({});
                await tx.chatbotFallback.deleteMany({});

                // Create patterns with their triggers
                for (let i = 0; i < chatPatterns.length; i++) {
                    const pattern = chatPatterns[i];

                    // Create the pattern
                    const createdPattern = await tx.chatbotPattern.create({
                        data: {
                            priority: i,
                            response: pattern.response,
                            isActive: true,
                            createdBy: session.user.id,
                        },
                    });

                    // Create triggers for this pattern
                    for (const phrase of pattern.patterns) {
                        await tx.chatbotTrigger.create({
                            data: {
                                phrase,
                                patternId: createdPattern.id,
                            },
                        });
                    }
                }

                // Create fallback responses
                for (const response of fallbackResponses) {
                    await tx.chatbotFallback.create({
                        data: {
                            response,
                        },
                    });
                }

                return { success: true };
            } catch (error) {
                console.error("Transaction error:", error);
                throw error;
            }
        });

        return NextResponse.json({
            success: true,
            message: "Chatbot patterns updated successfully",
        });
    } catch (error) {
        console.error("Error updating chatbot patterns:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update chatbot patterns",
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

// Initial seed function to populate database from knowledge base if empty
export async function seedChatbotPatternsIfEmpty() {
    try {
        // Check if chatbot models are available in Prisma client
        if (!db.chatbotPattern || !db.chatbotTrigger || !db.chatbotFallback) {
            console.warn("ChatbotPattern models not available in Prisma client yet. Skipping seeding.");
            return false;
        }

        try {
            const patternsCount = await db.chatbotPattern.count();

            if (patternsCount === 0) {
                // Database is empty, seed it from knowledge base
                const transaction = await db.$transaction(async (tx) => {
                    // Create patterns with their triggers
                    for (let i = 0; i < knowledgeBase.chatPatterns.length; i++) {
                        const pattern = knowledgeBase.chatPatterns[i];

                        // Create the pattern
                        const createdPattern = await tx.chatbotPattern.create({
                            data: {
                                priority: i,
                                response: pattern.response,
                                isActive: true,
                            },
                        });

                        // Create triggers for this pattern
                        for (const phrase of pattern.patterns) {
                            await tx.chatbotTrigger.create({
                                data: {
                                    phrase,
                                    patternId: createdPattern.id,
                                },
                            });
                        }
                    }

                    // Create fallback responses
                    for (const response of knowledgeBase.fallbackResponses) {
                        await tx.chatbotFallback.create({
                            data: {
                                response,
                            },
                        });
                    }
                });

                console.log("Seeded chatbot patterns from knowledge base");
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error in Prisma operations:", error);
            // If we get here, the Prisma client may be out of sync with the schema
            return false;
        }
    } catch (error) {
        console.error("Error seeding chatbot patterns:", error);
        return false;
    }
}

// Test endpoint for the chatbot
export async function generateResponse(message: string): Promise<string> {
    try {
        // Make sure we have patterns in the database
        await seedChatbotPatternsIfEmpty();

        // First try database-driven chatbot
        try {
            if (db.chatbotPattern && db.chatbotTrigger && db.chatbotFallback) {
                // Fetch patterns with their triggers
                const patterns = await db.chatbotPattern.findMany({
                    include: {
                        triggers: true,
                    },
                    orderBy: {
                        priority: 'asc',
                    },
                    where: {
                        isActive: true,
                    }
                });

                // Track matching scores for each pattern
                const patternScores: { pattern: any, score: number }[] = [];
                const lowerMessage = message.toLowerCase();
                const keywords = extractKeywords(lowerMessage);

                // Try to match the message against our patterns
                for (const pattern of patterns) {
                    // Calculate match score
                    let score = 0;

                    // Extract trigger phrases
                    const triggerPhrases = pattern.triggers.map(trigger => trigger.phrase);

                    // Check direct substring matches
                    const directMatch = triggerPhrases.some(phrase =>
                        lowerMessage.includes(phrase.toLowerCase())
                    );

                    if (directMatch) {
                        score += 10; // High score for direct match
                    }

                    // Check keyword matches
                    const patternKeywords = triggerPhrases.flatMap(phrase =>
                        extractKeywords(phrase.toLowerCase()));

                    for (const keyword of keywords) {
                        if (patternKeywords.includes(keyword)) {
                            score += 2; // Add points for each keyword match
                        }
                    }

                    if (score > 0) {
                        patternScores.push({ pattern, score });
                    }
                }

                // Sort by score (highest first)
                patternScores.sort((a, b) => b.score - a.score);

                // If we have a good match, return it
                if (patternScores.length > 0 && patternScores[0].score >= 2) {
                    return patternScores[0].pattern.response;
                }

                // If no pattern matches, return a random fallback response
                const fallbacks = await db.chatbotFallback.findMany();
                if (fallbacks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fallbacks.length);
                    return fallbacks[randomIndex].response;
                }
            }
        } catch (dbError) {
            console.error("Database error in generateResponse:", dbError);
            // Fall through to fallback implementation
        }

        // Fallback to static knowledge base if database doesn't work
        const staticPatterns = knowledgeBase.chatPatterns;
        const lowerMessage = message.toLowerCase();
        const keywords = extractKeywords(lowerMessage);

        // Try to match using static patterns
        for (const pattern of staticPatterns) {
            // Check direct match first (more accurate)
            if (pattern.patterns.some(phrase => lowerMessage.includes(phrase.toLowerCase()))) {
                return pattern.response;
            }

            // Then check for keyword matches
            const patternKeywords = pattern.patterns.flatMap(phrase =>
                extractKeywords(phrase.toLowerCase()));

            let keywordMatches = 0;
            for (const keyword of keywords) {
                if (patternKeywords.includes(keyword)) {
                    keywordMatches++;
                }
            }

            // If we have multiple keyword matches, it's likely relevant
            if (keywordMatches >= 2) {
                return pattern.response;
            }
        }

        // If nothing matches, return a random fallback response
        const fallbacks = knowledgeBase.fallbackResponses;
        const randomIndex = Math.floor(Math.random() * fallbacks.length);
        return fallbacks[randomIndex];
    } catch (error) {
        console.error("Error in generateResponse:", error);
        return "I'm having trouble processing your request. Please try again later.";
    }
}

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
    // Remove punctuation and convert to lowercase
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');

    // Split into words
    const words = cleanText.split(/\s+/);

    // Filter out common stop words
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with',
        'about', 'by', 'of', 'from', 'up', 'down', 'that', 'this', 'these',
        'those', 'them', 'they', 'their', 'i', 'me', 'my', 'mine', 'you',
        'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
        'do', 'does', 'did', 'have', 'has', 'had', 'would', 'could', 'should'];

    return words.filter(word => word.length > 1 && !stopWords.includes(word));
}

// Simple test endpoint for direct testing 
export async function PUT(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, error: "Invalid request. Please provide a 'message' field." },
                { status: 400 }
            );
        }

        // Generate response using our existing function
        const response = await generateResponse(message);

        return NextResponse.json({
            success: true,
            message: response
        });
    } catch (error) {
        console.error("Error in chatbot test endpoint:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process message" },
            { status: 500 }
        );
    }
}