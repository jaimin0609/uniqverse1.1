import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

// AI Learning Management API
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';

        // Get learning data
        const learningData = await db.chatbotLearning.findMany({
            where: status !== 'all' ? { status } : {},
            include: {
                reviewer: {
                    select: { name: true, email: true }
                }
            },
            orderBy: [
                { frequency: 'desc' },
                { lastOccurred: 'desc' }
            ]
        });

        return NextResponse.json({
            success: true,
            learningData: learningData.map(item => ({
                id: item.id,
                userMessage: item.userMessage,
                expectedResponse: item.expectedResponse,
                frequency: item.frequency,
                status: item.status,
                lastOccurred: item.lastOccurred.toISOString(),
                reviewedBy: item.reviewer?.name
            }))
        });

    } catch (error) {
        console.error("AI Learning GET error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { id, expectedResponse, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({
                error: "ID and status are required"
            }, { status: 400 });
        }

        // Update learning item
        const updatedItem = await db.chatbotLearning.update({
            where: { id },
            data: {
                expectedResponse,
                status,
                reviewedBy: session.user.id,
                updatedAt: new Date()
            }
        });

        // If implemented, create a new pattern
        if (status === 'implemented' && expectedResponse) {
            await createPatternFromLearning(updatedItem.userMessage, expectedResponse);
        }

        return NextResponse.json({
            success: true,
            item: updatedItem
        });

    } catch (error) {
        console.error("AI Learning PUT error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { action, data } = await req.json();

        switch (action) {
            case 'auto_learn':
                return await autoLearnFromConversations();
            case 'update_website_context':
                return await updateWebsiteContextFromUrl(data.url, data.category);
            case 'bulk_implement':
                return await bulkImplementLearnings(data.ids);
            default:
                return NextResponse.json({
                    error: "Invalid action"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("AI Learning POST error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function createPatternFromLearning(userMessage: string, response: string) {
    try {
        // Extract key phrases from user message
        const keywords = extractKeywords(userMessage);
        const mainPhrases = extractMainPhrases(userMessage);

        // Create pattern with high priority for learned responses
        const pattern = await db.chatbotPattern.create({
            data: {
                response,
                priority: 10, // High priority for learned patterns
                isActive: true
            }
        });        // Create triggers
        const triggers: { phrase: string; patternId: string }[] = [];

        // Add main phrases as triggers
        for (const phrase of mainPhrases) {
            triggers.push({
                phrase: phrase.toLowerCase(),
                patternId: pattern.id
            });
        }

        // Add keyword combinations as triggers
        if (keywords.length >= 2) {
            triggers.push({
                phrase: keywords.slice(0, 3).join(' '),
                patternId: pattern.id
            });
        }

        await db.chatbotTrigger.createMany({
            data: triggers
        });

        console.log(`Created pattern with ${triggers.length} triggers for learning item`);

    } catch (error) {
        console.error("Error creating pattern from learning:", error);
    }
}

async function autoLearnFromConversations() {
    try {
        // Analyze recent conversations with high satisfaction ratings
        const goodConversations = await db.chatbotConversation.findMany({
            where: {
                satisfactionRating: { gte: 4 },
                startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        let patternsCreated = 0;

        for (const conversation of goodConversations) {
            const messages = conversation.messages;

            // Find Q&A pairs
            for (let i = 0; i < messages.length - 1; i++) {
                const userMsg = messages[i];
                const botMsg = messages[i + 1];

                if (userMsg.role === 'user' && botMsg.role === 'assistant' &&
                    botMsg.confidence && botMsg.confidence < 0.7) {                    // This was a low-confidence response that got good feedback
                    // Create a learning entry for review
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
                                expectedResponse: botMsg.content,
                                frequency: 1,
                                status: 'pending'
                            }
                        });
                    }
                    patternsCreated++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${patternsCreated} learning entries from successful conversations`
        });

    } catch (error) {
        console.error("Auto learning error:", error);
        throw error;
    }
}

async function updateWebsiteContextFromUrl(url: string, category: string) {
    try {
        // Simple content extraction - in production you'd use a proper scraper
        const response = await fetch(url);
        const html = await response.text();

        // Basic text extraction (remove HTML tags)
        const textContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(); const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'Page Content';
        const keywords = extractKeywords(textContent);

        // Check if context exists first
        const existingContext = await db.websiteContext.findFirst({
            where: { page: url }
        });

        if (existingContext) {
            await db.websiteContext.update({
                where: { id: existingContext.id },
                data: {
                    title,
                    content: textContent.substring(0, 2000), // Limit content length
                    keywords,
                    category,
                    lastUpdated: new Date()
                }
            });
        } else {
            await db.websiteContext.create({
                data: {
                    page: url,
                    title,
                    content: textContent.substring(0, 2000),
                    keywords,
                    category,
                    lastUpdated: new Date(),
                    isActive: true
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Updated context for ${url}`
        });

    } catch (error) {
        console.error("Website context update error:", error);
        throw error;
    }
}

async function bulkImplementLearnings(ids: string[]) {
    try {
        let implemented = 0;

        for (const id of ids) {
            const learning = await db.chatbotLearning.findUnique({
                where: { id }
            });

            if (learning && learning.expectedResponse) {
                await createPatternFromLearning(learning.userMessage, learning.expectedResponse);

                await db.chatbotLearning.update({
                    where: { id },
                    data: { status: 'implemented' }
                });

                implemented++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Implemented ${implemented} learning patterns`
        });

    } catch (error) {
        console.error("Bulk implementation error:", error);
        throw error;
    }
}

function extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/);

    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'by',
        'of', 'from', 'up', 'down', 'that', 'this', 'these', 'those', 'them', 'they',
        'their', 'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'how', 'what', 'when']);

    const wordFreq = new Map<string, number>();

    words.forEach(word => {
        if (word.length > 2 && !stopWords.has(word)) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
    });

    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

function extractMainPhrases(text: string): string[] {
    const phrases: string[] = [];

    // Split by punctuation and common sentence enders
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    for (const sentence of sentences) {
        // Extract phrases between 2-6 words
        const words = sentence.toLowerCase().split(/\s+/);

        for (let i = 0; i <= words.length - 2; i++) {
            for (let len = 2; len <= Math.min(6, words.length - i); len++) {
                const phrase = words.slice(i, i + len).join(' ');
                if (phrase.length > 5 && !phrase.match(/^(how|what|when|where|why|can|could|would|should)/)) {
                    phrases.push(phrase);
                }
            }
        }
    }

    // Remove duplicates and return top phrases
    return [...new Set(phrases)].slice(0, 5);
}
