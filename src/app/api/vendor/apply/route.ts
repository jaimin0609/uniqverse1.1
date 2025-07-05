import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendNewVendorApplicationNotification } from "@/lib/email-utils";

// Vendor application schema
const vendorApplicationSchema = z.object({
    businessName: z.string().min(1, "Business name is required"),
    businessType: z.string().min(1, "Business type is required"),
    businessDescription: z.string().min(10, "Business description must be at least 10 characters"),
    businessAddress: z.string().min(1, "Business address is required"),
    businessPhone: z.string().min(1, "Business phone is required"),
    businessWebsite: z.string().url("Valid website URL required").optional().or(z.literal("")),
    taxId: z.string().min(1, "Tax ID is required"),
    bankAccount: z.string().min(1, "Bank account information is required"),
    expectedMonthlyVolume: z.string().min(1, "Expected monthly volume is required"),
    productCategories: z.array(z.string()).min(1, "At least one product category must be selected"),
    hasBusinessLicense: z.boolean().refine(val => val === true, "Business license is required"),
    agreesToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
    agreeToCommission: z.boolean().refine(val => val === true, "You must agree to the commission structure"),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Check if user is already a vendor
        if (session.user.role === "VENDOR") {
            return NextResponse.json(
                { error: "You are already a vendor" },
                { status: 400 }
            );
        }

        // Parse and validate request body
        const body = await req.json();
        const validationResult = vendorApplicationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.format()
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Check if user has already submitted an application
        const existingApplication = await db.vendorApplication.findUnique({
            where: { userId: session.user.id }
        });

        if (existingApplication) {
            return NextResponse.json(
                { error: "You have already submitted a vendor application" },
                { status: 400 }
            );
        }        // Create vendor application
        const application = await db.vendorApplication.create({
            data: {
                userId: session.user.id,
                businessName: data.businessName,
                businessType: data.businessType,
                businessDescription: data.businessDescription,
                businessAddress: data.businessAddress,
                businessPhone: data.businessPhone,
                businessWebsite: data.businessWebsite || null,
                taxId: data.taxId,
                bankAccount: data.bankAccount,
                expectedMonthlyVolume: data.expectedMonthlyVolume,
                productCategories: data.productCategories,
                hasBusinessLicense: data.hasBusinessLicense,
                agreesToTerms: data.agreesToTerms,
                agreeToCommission: data.agreeToCommission,
                status: "PENDING",
                submittedAt: new Date(),
            }
        });

        // Send notification email to admins about new vendor application
        try {
            await sendNewVendorApplicationNotification(application.id);
        } catch (error) {
            console.error("Failed to send admin notification email:", error);
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            message: "Vendor application submitted successfully",
            applicationId: application.id
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

// GET - Check application status
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user's vendor application
        const application = await db.vendorApplication.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                status: true,
                submittedAt: true,
                reviewedAt: true,
                rejectionReason: true,
                businessName: true,
            }
        });

        if (!application) {
            return NextResponse.json({
                hasApplication: false,
                application: null
            });
        }

        return NextResponse.json({
            hasApplication: true,
            application
        });

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
