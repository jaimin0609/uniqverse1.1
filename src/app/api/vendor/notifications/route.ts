import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { EnhancedVendorCommissionService } from "@/lib/enhanced-vendor-commission-service";

// GET vendor notifications and preferences
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'preferences' or 'alerts'

        if (type === 'alerts') {
            // Get vendor performance metrics
            const metrics = await EnhancedVendorCommissionService.getVendorPerformanceMetrics(vendorId);

            // Get plan recommendation
            const recommendation = await EnhancedVendorCommissionService.getVendorPlanRecommendation(vendorId);

            // Generate notifications based on performance and recommendations
            const notifications: any[] = [];

            // Plan recommendation notification
            if (recommendation.recommendedPlan !== recommendation.currentPlan) {
                notifications.push({
                    id: 'plan-recommendation',
                    type: 'PLAN_RECOMMENDATION',
                    priority: 'HIGH',
                    title: `Upgrade to ${recommendation.recommendedPlan} Plan`,
                    message: recommendation.reasoning,
                    potentialSavings: recommendation.potentialSavings,
                    actionUrl: '/vendor/plans',
                    actionText: 'View Plans',
                    createdAt: new Date().toISOString()
                });
            }

            // Performance milestones
            if (metrics.averageRating >= 4.5 && metrics.orderCount >= 50) {
                notifications.push({
                    id: 'performance-excellence',
                    type: 'PERFORMANCE_MILESTONE',
                    priority: 'MEDIUM',
                    title: 'Excellent Performance Achievement!',
                    message: `You've achieved a ${metrics.averageRating.toFixed(1)} rating with ${metrics.orderCount} orders. You're now eligible for performance bonuses!`,
                    actionUrl: '/vendor/analytics',
                    actionText: 'View Analytics',
                    createdAt: new Date().toISOString()
                });
            }

            // Performance warnings
            if (metrics.averageRating < 3.5) {
                notifications.push({
                    id: 'performance-warning',
                    type: 'PERFORMANCE_WARNING',
                    priority: 'HIGH',
                    title: 'Performance Improvement Needed',
                    message: `Your current rating is ${metrics.averageRating.toFixed(1)}. Consider improving customer service to avoid penalties.`,
                    actionUrl: '/vendor/analytics',
                    actionText: 'View Details',
                    createdAt: new Date().toISOString()
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    notifications,
                    unreadCount: notifications.length
                }
            });
        }

        // Return notification preferences (default behavior)
        const notifications = {
            orderNotifications: true,
            lowStockAlerts: true,
            paymentNotifications: true,
            marketingEmails: false,
            weeklyReports: true,
            planRecommendations: true,
            performanceAlerts: true,
            billingReminders: true
        };

        return NextResponse.json({ notifications });

    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification preferences" },
            { status: 500 }
        );
    }
}

// PUT update vendor notification preferences
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // In a production app, you would save these to a database
        // For now, we'll just return success

        return NextResponse.json({
            success: true,
            message: "Notification preferences updated"
        });

    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to update notification preferences" },
            { status: 500 }
        );
    }
}
