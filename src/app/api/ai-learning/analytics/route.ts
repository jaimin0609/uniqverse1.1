import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

// AI Analytics API
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const analytics = await generateAnalytics();

        return NextResponse.json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error("Analytics GET error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function generateAnalytics() {
    try {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Total conversations and messages
        const [totalConversations, totalMessages] = await Promise.all([
            db.chatbotConversation.count({
                where: { startedAt: { gte: lastMonth } }
            }),
            db.chatbotMessage.count({
                where: {
                    timestamp: { gte: lastMonth },
                    role: 'user'
                }
            })
        ]);

        // Average satisfaction rating
        const satisfactionData = await db.chatbotConversation.aggregate({
            where: {
                startedAt: { gte: lastMonth },
                satisfactionRating: { not: null }
            },
            _avg: { satisfactionRating: true },
            _count: { satisfactionRating: true }
        });

        // Escalation and resolution rates
        const escalatedCount = await db.chatbotConversation.count({
            where: {
                startedAt: { gte: lastMonth },
                wasEscalated: true
            }
        });

        const resolvedCount = await db.chatbotConversation.count({
            where: {
                startedAt: { gte: lastMonth },
                wasResolved: true
            }
        });

        // Average response time
        const responseTimeData = await db.chatbotMessage.aggregate({
            where: {
                timestamp: { gte: lastMonth },
                role: 'assistant',
                processingTime: { not: null }
            },
            _avg: { processingTime: true }
        });

        // Top topics
        const topTopics = await getTopTopics(lastMonth);

        // Unmatched queries
        const unmatchedQueries = await db.chatbotLearning.count({
            where: {
                lastOccurred: { gte: lastMonth },
                status: 'pending'
            }
        });

        // Recent trends
        const weeklyTrends = await getWeeklyTrends();

        // Pattern effectiveness
        const patternStats = await getPatternEffectiveness();

        return {
            totalConversations,
            totalMessages,
            avgSatisfaction: satisfactionData._avg.satisfactionRating || 0,
            satisfactionCount: satisfactionData._count.satisfactionRating,
            escalationRate: totalConversations > 0 ? (escalatedCount / totalConversations) * 100 : 0,
            resolutionRate: totalConversations > 0 ? (resolvedCount / totalConversations) * 100 : 0,
            avgResponseTime: responseTimeData._avg.processingTime || 0,
            topTopics,
            unmatchedQueries,
            weeklyTrends,
            patternStats
        };

    } catch (error) {
        console.error("Analytics generation error:", error);
        throw error;
    }
}

async function getTopTopics(since: Date) {
    try {
        // Get all conversation tags and count them
        const conversations = await db.chatbotConversation.findMany({
            where: { startedAt: { gte: since } },
            select: { tags: true }
        });

        const topicCount = new Map<string, number>();

        conversations.forEach(conv => {
            conv.tags.forEach(tag => {
                topicCount.set(tag, (topicCount.get(tag) || 0) + 1);
            });
        });

        return Array.from(topicCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));

    } catch (error) {
        console.error("Top topics error:", error);
        return [];
    }
}

async function getWeeklyTrends() {
    try {
        const trends: Array<{
            week: string;
            conversations: number;
            messages: number;
            avgSatisfaction: number;
        }> = [];
        const now = new Date();

        for (let week = 0; week < 4; week++) {
            const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);

            const [conversations, messages, avgSatisfaction] = await Promise.all([
                db.chatbotConversation.count({
                    where: {
                        startedAt: {
                            gte: weekStart,
                            lt: weekEnd
                        }
                    }
                }),
                db.chatbotMessage.count({
                    where: {
                        timestamp: {
                            gte: weekStart,
                            lt: weekEnd
                        },
                        role: 'user'
                    }
                }),
                db.chatbotConversation.aggregate({
                    where: {
                        startedAt: {
                            gte: weekStart,
                            lt: weekEnd
                        },
                        satisfactionRating: { not: null }
                    },
                    _avg: { satisfactionRating: true }
                })
            ]);

            trends.unshift({
                week: `Week ${week + 1}`,
                conversations,
                messages,
                avgSatisfaction: avgSatisfaction._avg.satisfactionRating || 0
            });
        }

        return trends;

    } catch (error) {
        console.error("Weekly trends error:", error);
        return [];
    }
}

async function getPatternEffectiveness() {
    try {
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Get pattern usage stats
        const patternUsage = await db.chatbotMessage.groupBy({
            by: ['patternMatched'],
            where: {
                timestamp: { gte: lastMonth },
                role: 'assistant',
                patternMatched: { not: null }
            },
            _count: { patternMatched: true },
            _avg: { confidence: true }
        });        // Get pattern details
        const patterns = await db.chatbotPattern.findMany({
            where: {
                id: { in: patternUsage.map(p => p.patternMatched).filter(Boolean) as string[] }
            },
            select: { id: true, response: true, priority: true }
        });

        return patternUsage.map(usage => {
            const pattern = patterns.find(p => p.id === usage.patternMatched);
            return {
                patternId: usage.patternMatched || 'unknown',
                response: pattern?.response ? pattern.response.substring(0, 100) + '...' : 'Unknown',
                usageCount: usage._count.patternMatched,
                avgConfidence: usage._avg.confidence || 0,
                priority: pattern?.priority || 0
            };
        }).sort((a, b) => b.usageCount - a.usageCount);

    } catch (error) {
        console.error("Pattern effectiveness error:", error);
        return [];
    }
}

// Store daily analytics
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        await storeDailyAnalytics();

        return NextResponse.json({
            success: true,
            message: "Daily analytics stored successfully"
        });

    } catch (error) {
        console.error("Store analytics error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function storeDailyAnalytics() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);        // Generate analytics for yesterday
        const analytics = await generateDailyAnalytics(yesterday, today);

        // Store in database - Check if record exists first
        const existingAnalytics = await db.chatbotAnalytics.findFirst({
            where: { date: yesterday }
        });

        if (existingAnalytics) {
            await db.chatbotAnalytics.update({
                where: { id: existingAnalytics.id },
                data: analytics
            });
        } else {
            await db.chatbotAnalytics.create({
                data: {
                    date: yesterday,
                    ...analytics
                }
            });
        }

        console.log("Daily analytics stored for", yesterday.toDateString());

    } catch (error) {
        console.error("Store daily analytics error:", error);
        throw error;
    }
}

async function generateDailyAnalytics(startDate: Date, endDate: Date) {
    const [
        totalConversations,
        totalMessages,
        satisfactionData,
        escalatedCount,
        resolvedCount,
        responseTimeData,
        topTopics,
        unmatchedQueries
    ] = await Promise.all([
        db.chatbotConversation.count({
            where: {
                startedAt: {
                    gte: startDate,
                    lt: endDate
                }
            }
        }),
        db.chatbotMessage.count({
            where: {
                timestamp: {
                    gte: startDate,
                    lt: endDate
                },
                role: 'user'
            }
        }),
        db.chatbotConversation.aggregate({
            where: {
                startedAt: {
                    gte: startDate,
                    lt: endDate
                },
                satisfactionRating: { not: null }
            },
            _avg: { satisfactionRating: true }
        }),
        db.chatbotConversation.count({
            where: {
                startedAt: {
                    gte: startDate,
                    lt: endDate
                },
                wasEscalated: true
            }
        }),
        db.chatbotConversation.count({
            where: {
                startedAt: {
                    gte: startDate,
                    lt: endDate
                },
                wasResolved: true
            }
        }),
        db.chatbotMessage.aggregate({
            where: {
                timestamp: {
                    gte: startDate,
                    lt: endDate
                },
                role: 'assistant',
                processingTime: { not: null }
            },
            _avg: { processingTime: true }
        }),
        getTopTopics(startDate),
        db.chatbotLearning.count({
            where: {
                lastOccurred: {
                    gte: startDate,
                    lt: endDate
                },
                status: 'pending'
            }
        })
    ]);

    return {
        totalConversations,
        totalMessages,
        avgSatisfaction: satisfactionData._avg.satisfactionRating,
        escalationRate: totalConversations > 0 ? (escalatedCount / totalConversations) * 100 : 0,
        resolutionRate: totalConversations > 0 ? (resolvedCount / totalConversations) * 100 : 0,
        avgResponseTime: responseTimeData._avg.processingTime,
        topTopics,
        unmatchedQueries
    };
}
