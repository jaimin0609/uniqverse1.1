import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Smart Response Rating API - Automatically rates responses based on user behavior
export async function POST(req: NextRequest) {
    try {
        const {
            conversationId,
            messageId,
            userAction,
            timeSpent,
            followUpQuestion,
            sessionData
        } = await req.json();

        if (!conversationId || !messageId || !userAction) {
            return NextResponse.json({
                error: "Missing required parameters"
            }, { status: 400 });
        }

        const rating = await calculateSmartRating({
            conversationId,
            messageId,
            userAction,
            timeSpent,
            followUpQuestion,
            sessionData
        });        // Store the intelligent rating
        await db.chatbotFeedback.create({
            data: {
                conversationId,
                messageId: messageId || null, // Allow null if messageId doesn't exist
                rating: rating.score,
                comment: rating.reason,
                feedbackType: 'automatic',
                createdAt: new Date()
            }
        });

        // Update message confidence based on rating (only if messageId exists)
        if (messageId) {
            try {
                await db.chatbotMessage.update({
                    where: { id: messageId },
                    data: {
                        wasHelpful: rating.score >= 4,
                    }
                });
            } catch (updateError) {
                console.warn(`Message ${messageId} not found for rating update:`, updateError);
                // Continue without failing - this is not critical
            }
        }

        // Learn from the interaction
        await learnFromInteraction(conversationId, messageId, rating, userAction);

        return NextResponse.json({
            success: true,
            rating: rating.score,
            reason: rating.reason
        });

    } catch (error) {
        console.error("Smart rating error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

interface RatingInput {
    conversationId: string;
    messageId: string;
    userAction: 'continued_chat' | 'ended_chat' | 'asked_followup' | 'clicked_link' | 'escalated' | 'repeated_question';
    timeSpent?: number; // seconds spent reading the response
    followUpQuestion?: string;
    sessionData?: any;
}

interface SmartRating {
    score: number; // 1-5
    reason: string;
    confidence: number; // 0-1
}

async function calculateSmartRating(input: RatingInput): Promise<SmartRating> {
    let score = 3; // Start with neutral
    let reasons: string[] = [];
    let confidence = 0.5;

    // Get the message and conversation context
    const message = await db.chatbotMessage.findUnique({
        where: { id: input.messageId },
        include: {
            conversation: {
                include: {
                    messages: {
                        orderBy: { timestamp: 'asc' }
                    }
                }
            }
        }
    });

    if (!message) {
        return { score: 3, reason: "Message not found", confidence: 0.1 };
    }

    // Factor 1: User Action Analysis
    switch (input.userAction) {
        case 'continued_chat':
            if (input.followUpQuestion) {
                // Check if follow-up is related (good) or completely different (bad)
                const similarity = await calculateQuestionSimilarity(
                    message.content,
                    input.followUpQuestion
                );
                if (similarity > 0.7) {
                    score += 1;
                    reasons.push("User asked related follow-up question");
                } else if (similarity < 0.3) {
                    score -= 1;
                    reasons.push("User asked unrelated question, suggesting initial response wasn't helpful");
                }
            } else {
                score += 0.5;
                reasons.push("User continued conversation");
            }
            break;

        case 'ended_chat':
            // Ending chat can be good (got answer) or bad (frustrated)
            if (input.timeSpent && input.timeSpent > 10) {
                score += 1;
                reasons.push("User spent time reading response before ending");
            } else if (input.timeSpent && input.timeSpent < 3) {
                score -= 1;
                reasons.push("User ended chat quickly, possibly unsatisfied");
            }
            break;

        case 'clicked_link':
            score += 2;
            reasons.push("User clicked provided link, indicating helpfulness");
            confidence += 0.2;
            break;

        case 'escalated':
            score -= 2;
            reasons.push("User escalated to human support");
            confidence += 0.3;
            break;

        case 'repeated_question':
            score -= 2;
            reasons.push("User repeated their question, indicating response wasn't adequate");
            confidence += 0.3;
            break;
    }

    // Factor 2: Time Spent Analysis
    if (input.timeSpent) {
        const expectedReadTime = estimateReadTime(message.content);
        const ratio = input.timeSpent / expectedReadTime;

        if (ratio > 1.5 && ratio < 3) {
            score += 0.5;
            reasons.push("User spent appropriate time reading response");
        } else if (ratio < 0.5) {
            score -= 0.5;
            reasons.push("User didn't spend enough time reading");
        } else if (ratio > 4) {
            score -= 0.5;
            reasons.push("User spent too long, possibly confused");
        }
    }

    // Factor 3: Response Confidence
    if (message.confidence) {
        if (message.confidence > 0.8) {
            score += 0.5;
            reasons.push("High-confidence response");
        } else if (message.confidence < 0.4) {
            score -= 0.5;
            reasons.push("Low-confidence response");
        }
        confidence += message.confidence * 0.2;
    }

    // Factor 4: Pattern Match Quality
    if (message.patternMatched) {
        const pattern = await db.chatbotPattern.findUnique({
            where: { id: message.patternMatched }
        });

        if (pattern && pattern.priority > 15) {
            score += 0.5;
            reasons.push("Used high-priority pattern");
        }
    }

    // Factor 5: Conversation Flow Analysis
    const conversationMessages = message.conversation?.messages || [];
    const messageIndex = conversationMessages.findIndex(m => m.id === input.messageId);

    if (messageIndex >= 0 && messageIndex < conversationMessages.length - 1) {
        // There are messages after this one
        const nextUserMessage = conversationMessages[messageIndex + 1];
        if (nextUserMessage && nextUserMessage.role === 'user') {
            const similarity = await calculateQuestionSimilarity(
                conversationMessages[messageIndex - 1]?.content || '',
                nextUserMessage.content
            );

            if (similarity > 0.8) {
                score -= 1;
                reasons.push("User immediately repeated similar question");
            }
        }
    }

    // Normalize score to 1-5 range
    score = Math.max(1, Math.min(5, Math.round(score)));
    confidence = Math.max(0.1, Math.min(1, confidence));

    return {
        score,
        reason: reasons.join('; '),
        confidence
    };
}

async function calculateQuestionSimilarity(question1: string, question2: string): Promise<number> {
    try {
        // Simple keyword-based similarity for now
        const words1 = new Set(question1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(question2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
        console.error("Similarity calculation error:", error);
        return 0.5; // Default to neutral similarity
    }
}

function estimateReadTime(text: string): number {
    // Average reading speed: 200-250 words per minute
    const words = text.split(/\s+/).length;
    const readingTimeMinutes = words / 225; // 225 WPM average
    return Math.max(3, readingTimeMinutes * 60); // Minimum 3 seconds
}

async function learnFromInteraction(
    conversationId: string,
    messageId: string,
    rating: SmartRating,
    userAction: string
) {
    try {
        // Get the message content for learning
        const message = await db.chatbotMessage.findUnique({
            where: { id: messageId }
        });

        if (!message) return;

        // Get the user question that prompted this response
        const userMessage = await db.chatbotMessage.findFirst({
            where: {
                conversationId,
                role: 'user',
                timestamp: { lt: message.timestamp }
            },
            orderBy: { timestamp: 'desc' }
        });

        if (!userMessage) return;        // Create learning entries based on rating
        if (rating.score >= 4 && rating.confidence > 0.7) {
            // Good response - reinforce this pattern
            const existingLearning = await db.chatbotLearning.findFirst({
                where: { userMessage: userMessage.content }
            });

            if (existingLearning) {
                await db.chatbotLearning.update({
                    where: { id: existingLearning.id },
                    data: {
                        expectedResponse: message.content,
                        frequency: { increment: 1 },
                        lastOccurred: new Date(),
                        status: 'reinforced'
                    }
                });
            } else {
                await db.chatbotLearning.create({
                    data: {
                        userMessage: userMessage.content,
                        expectedResponse: message.content,
                        frequency: 1,
                        status: 'reinforced'
                    }
                });
            }
        } else if (rating.score <= 2 && rating.confidence > 0.6) {
            // Poor response - mark for improvement
            const existingLearning = await db.chatbotLearning.findFirst({
                where: { userMessage: userMessage.content }
            });

            if (existingLearning) {
                await db.chatbotLearning.update({
                    where: { id: existingLearning.id },
                    data: {
                        frequency: { increment: 1 },
                        lastOccurred: new Date(),
                        status: 'needs_improvement'
                    }
                });
            } else {
                await db.chatbotLearning.create({
                    data: {
                        userMessage: userMessage.content,
                        frequency: 1,
                        status: 'needs_improvement'
                    }
                });
            }
        }

        // Learn from specific user actions
        if (userAction === 'escalated') {
            // Track escalation patterns
            await db.chatbotLearning.create({
                data: {
                    userMessage: `ESCALATION_PATTERN: ${userMessage.content}`,
                    expectedResponse: `This type of question often requires human assistance: ${rating.reason}`,
                    frequency: 1,
                    status: 'escalation_pattern'
                }
            });
        }

    } catch (error) {
        console.error("Learning from interaction error:", error);
    }
}

// Endpoint to get smart ratings for analysis
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const ratings = await db.chatbotFeedback.findMany({
            where: {
                createdAt: { gte: since },
                feedbackType: 'automatic'
            },
            include: {
                conversation: {
                    select: { tags: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Analyze patterns in ratings
        const analysis = {
            totalRatings: ratings.length,
            averageRating: ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length,
            ratingDistribution: {
                excellent: ratings.filter(r => r.rating === 5).length,
                good: ratings.filter(r => r.rating === 4).length,
                neutral: ratings.filter(r => r.rating === 3).length,
                poor: ratings.filter(r => r.rating === 2).length,
                terrible: ratings.filter(r => r.rating === 1).length
            },
            commonIssues: extractCommonIssues(ratings),
            improvementAreas: identifyImprovementAreas(ratings)
        };

        return NextResponse.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error("Smart rating analysis error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

function extractCommonIssues(ratings: any[]): string[] {
    const issues = new Map<string, number>();

    ratings.filter(r => r.rating <= 2).forEach(rating => {
        if (rating.comment) {
            const words = rating.comment.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 4) {
                    issues.set(word, (issues.get(word) || 0) + 1);
                }
            });
        }
    });

    return Array.from(issues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([issue]) => issue);
}

function identifyImprovementAreas(ratings: any[]): string[] {
    const areas = new Set<string>();

    ratings.filter(r => r.rating <= 2).forEach(rating => {
        if (rating.comment) {
            const comment = rating.comment.toLowerCase();
            if (comment.includes('escalat')) areas.add('Reduce escalations');
            if (comment.includes('repeat')) areas.add('Improve initial responses');
            if (comment.includes('time') || comment.includes('slow')) areas.add('Response speed');
            if (comment.includes('confus')) areas.add('Clarity of responses');
            if (comment.includes('link') || comment.includes('url')) areas.add('Better link integration');
        }
    });

    return Array.from(areas);
}
