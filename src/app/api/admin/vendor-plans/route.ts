import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { EnhancedVendorCommissionService } from "@/lib/enhanced-vendor-commission-service";

// GET admin vendor plan overview
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.role || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all vendors with their plan information
        const vendors = await db.user.findMany({
            where: { role: 'VENDOR' },
            include: {
                vendorCommissionSettings: true,
                _count: {
                    select: {
                        VendorProducts: true,
                        orders: true,
                        vendorCommissions: true
                    }
                }
            }
        });

        // Calculate plan statistics
        const planStats = {
            STARTER: { count: 0, totalRevenue: 0, avgCommission: 0 },
            PROFESSIONAL: { count: 0, totalRevenue: 0, avgCommission: 0 },
            ENTERPRISE: { count: 0, totalRevenue: 0, avgCommission: 0 }
        };

        const vendorDetails = await Promise.all(
            vendors.map(async (vendor) => {
                const planType = vendor.vendorCommissionSettings?.planType || 'STARTER';
                const metrics = await EnhancedVendorCommissionService.getVendorPerformanceMetrics(vendor.id);

                planStats[planType as keyof typeof planStats].count++;
                planStats[planType as keyof typeof planStats].totalRevenue += metrics.totalSales;

                return {
                    id: vendor.id,
                    name: vendor.name,
                    email: vendor.email,
                    planType,
                    subscriptionStatus: vendor.vendorCommissionSettings?.subscriptionStatus || 'ACTIVE',
                    monthlyFee: EnhancedVendorCommissionService.VENDOR_PLANS[planType as keyof typeof EnhancedVendorCommissionService.VENDOR_PLANS].monthlyFee,
                    totalProducts: vendor._count.VendorProducts,
                    totalOrders: vendor._count.orders,
                    totalCommissions: vendor._count.vendorCommissions,
                    performanceMetrics: metrics,
                    createdAt: vendor.createdAt,
                    lastActive: vendor.updatedAt
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                vendors: vendorDetails,
                planStats,
                totalVendors: vendors.length,
                totalRevenue: Object.values(planStats).reduce((sum, stat) => sum + stat.totalRevenue, 0)
            }
        });

    } catch (error) {
        console.error("Error fetching admin vendor plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch vendor plans" },
            { status: 500 }
        );
    }
}

// POST admin actions (plan changes, suspensions, etc.)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.role || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, vendorId, planType, reason } = await request.json();

        switch (action) {
            case 'CHANGE_PLAN':
                await EnhancedVendorCommissionService.initializeEnhancedVendorSettings(vendorId, planType);

                // Log admin action
                await db.adminAuditLog.create({
                    data: {
                        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        performedById: session.user.id,
                        action: 'VENDOR_PLAN_CHANGE',
                        details: `Changed vendor plan to ${planType}. Reason: ${reason || 'No reason provided'}`
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: `Successfully changed vendor plan to ${planType}`
                });

            case 'SUSPEND_VENDOR':
                await db.vendorCommissionSettings.update({
                    where: { vendorId },
                    data: { subscriptionStatus: 'SUSPENDED' }
                });

                await db.adminAuditLog.create({
                    data: {
                        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        performedById: session.user.id,
                        action: 'VENDOR_SUSPEND',
                        details: `Suspended vendor account: ${vendorId}. Reason: ${reason || 'No reason provided'}`
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Vendor account suspended successfully'
                });

            case 'ACTIVATE_VENDOR':
                await db.vendorCommissionSettings.update({
                    where: { vendorId },
                    data: { subscriptionStatus: 'ACTIVE' }
                });

                await db.adminAuditLog.create({
                    data: {
                        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        performedById: session.user.id,
                        action: 'VENDOR_ACTIVATE',
                        details: `Activated vendor account: ${vendorId}. Reason: ${reason || 'No reason provided'}`
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Vendor account activated successfully'
                });

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error("Error performing admin action:", error);
        return NextResponse.json(
            { error: "Failed to perform action" },
            { status: 500 }
        );
    }
}
