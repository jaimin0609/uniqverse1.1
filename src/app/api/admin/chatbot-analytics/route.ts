import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET - Retrieve chatbot analytics
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '30days';

        // Calculate date range
        let startDate = new Date();
        switch (period) {
            case '7days':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '90days':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default: // 30days
                startDate.setDate(startDate.getDate() - 30);
        }

        // Get conversation statistics
        const conversations = await db.chatbotConversation.findMany({
            where: {
                startedAt: {
                    gte: startDate
                }
            },
            include: {
                messages: {
                    select: {
                        role: true,
                        confidence: true,
                        patternMatched: true,
                        wasHelpful: true
                    }
                },
                feedback: {
                    select: {
                        rating: true,
                        feedbackType: true
                    }
                }
            }
        });

        // Calculate metrics
        const totalConversations = conversations.length;
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.totalMessages, 0);

        // Calculate AI confidence average
        const aiMessages = conversations.flatMap(conv =>
            conv.messages.filter(msg => msg.role === 'assistant' && msg.confidence)
        );
        const avgConfidence = aiMessages.length > 0
            ? aiMessages.reduce((sum, msg) => sum + (msg.confidence || 0), 0) / aiMessages.length
            : 0;

        // Calculate satisfaction rating
        const ratings = conversations.flatMap(conv => conv.feedback.map(f => f.rating));
        const avgSatisfaction = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        // Calculate escalation rate
        const escalatedConversations = conversations.filter(conv => conv.wasEscalated).length;
        const escalationRate = totalConversations > 0
            ? (escalatedConversations / totalConversations) * 100
            : 0;

        // Calculate product search success (mock for now - would need actual product search data)
        const productSearchSuccess = 73; // Placeholder

        // Calculate response time (mock - would need actual timing data)
        const avgResponseTime = 1.2; // seconds

        // Calculate follow-up rate
        const conversationsWithFollowups = conversations.filter(conv => conv.totalMessages > 2).length;
        const followUpRate = totalConversations > 0
            ? (conversationsWithFollowups / totalConversations) * 100
            : 0;

        // Get top intent categories (mock data for now)
        const topIntents = [
            { name: 'Product Information', percentage: 28 },
            { name: 'Order Support', percentage: 24 },
            { name: 'Shipping Information', percentage: 20 },
            { name: 'Returns & Exchanges', percentage: 16 },
            { name: 'Account Help', percentage: 12 }
        ];

        // Get learning opportunities from ChatbotLearning model
        const learningOpportunities = await db.chatbotLearning.findMany({
            where: {
                status: 'pending',
                lastOccurred: {
                    gte: startDate
                }
            },
            orderBy: {
                frequency: 'desc'
            },
            take: 10
        });

        // Format learning opportunities
        const formattedLearningOps = learningOpportunities.map(op => ({
            type: op.frequency > 3 ? 'Repeated query' : 'Low confidence response',
            query: op.userMessage,
            metric: op.frequency > 3 ? `${op.frequency}x this week` : 'Low confidence',
            suggestion: op.expectedResponse || 'Needs review'
        }));

        // Get previous period data for comparison
        const prevStartDate = new Date(startDate);
        prevStartDate.setTime(prevStartDate.getTime() - (Date.now() - startDate.getTime()));

        const prevConversations = await db.chatbotConversation.count({
            where: {
                startedAt: {
                    gte: prevStartDate,
                    lt: startDate
                }
            }
        });

        const conversationGrowth = prevConversations > 0
            ? ((totalConversations - prevConversations) / prevConversations) * 100
            : 0;

        return NextResponse.json({
            success: true,
            analytics: {
                totalConversations,
                totalMessages,
                avgConfidence: Math.round(avgConfidence * 100),
                avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
                escalationRate: Math.round(escalationRate),
                productSearchSuccess,
                avgResponseTime,
                followUpRate: Math.round(followUpRate),
                conversationGrowth: Math.round(conversationGrowth),
                topIntents,
                learningOpportunities: formattedLearningOps,
                period
            }
        });

    } catch (error) {
        console.error("Error fetching chatbot analytics:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
