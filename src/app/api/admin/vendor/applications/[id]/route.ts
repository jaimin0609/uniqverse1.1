import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sendVendorApplicationStatusEmail } from "@/lib/email-utils";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const application = await db.vendorApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true,
                        role: true,
                    }
                }
            }
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ application });

    } catch (error) {
        console.error("Error fetching vendor application:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch vendor application",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await req.json();
        const { action, rejectionReason } = body;

        // Validate action
        if (!['approve', 'reject', 'review'].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        // Get the application
        const application = await db.vendorApplication.findUnique({
            where: { id },
            include: {
                user: true
            }
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Check if application is in a valid state for this action
        if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
            return NextResponse.json(
                { error: "Application has already been processed" },
                { status: 400 }
            );
        }

        let newStatus: string;
        let updateUserRole = false;

        switch (action) {
            case 'approve':
                newStatus = 'APPROVED';
                updateUserRole = true;
                break;
            case 'reject':
                newStatus = 'REJECTED';
                if (!rejectionReason) {
                    return NextResponse.json(
                        { error: "Rejection reason is required" },
                        { status: 400 }
                    );
                }
                break;
            case 'review':
                newStatus = 'UNDER_REVIEW';
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        // Update application status
        const updatedApplication = await db.vendorApplication.update({
            where: { id },
            data: {
                status: newStatus as any,
                reviewedAt: new Date(),
                rejectionReason: action === 'reject' ? rejectionReason : null,
            }
        });

        // If approved, update user role to VENDOR
        if (updateUserRole) {
            await db.user.update({
                where: { id: application.userId },
                data: {
                    role: 'VENDOR'
                }
            });
        }        // Log admin action
        await db.adminAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: `VENDOR_APPLICATION_${action.toUpperCase()}`,
                details: `${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Set to review'} vendor application for ${application.businessName}${action === 'reject' ? ` - Reason: ${rejectionReason}` : ''}`,
                performedById: session.user.id,
            }
        });

        // Send email notification to applicant about status change
        try {
            await sendVendorApplicationStatusEmail(
                application.id,
                newStatus as 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW',
                rejectionReason
            );
        } catch (error) {
            console.error("Failed to send status notification email:", error);
            // Don't fail the request if email fails
        }

        const message = action === 'approve'
            ? `Vendor application approved. User ${application.user.name} is now a vendor.`
            : action === 'reject'
                ? `Vendor application rejected.`
                : `Vendor application set to under review.`;

        return NextResponse.json({
            success: true,
            message,
            application: updatedApplication
        });

    } catch (error) {
        console.error("Error processing vendor application:", error);
        return NextResponse.json(
            {
                error: "Failed to process vendor application",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
