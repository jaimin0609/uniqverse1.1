import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const jobApplicationSchema = z.object({
    jobPositionId: z.string().min(1, "Job position ID is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    resumeUrl: z.string().url("Valid resume URL is required").optional(),
    coverLetter: z.string().optional(),
    experience: z.string().optional(),
    education: z.string().optional(),
    availability: z.string().optional(),
    expectedSalary: z.string().optional(),
});

// Get job applications (Admin or user's own applications)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const jobId = url.searchParams.get('jobId');
        const userId = url.searchParams.get('userId');

        let whereClause: any = {};

        if (session.user.role === "ADMIN") {
            // Admin can see all applications
            if (jobId) {
                whereClause.jobPositionId = jobId;
            }
            if (userId) {
                whereClause.userId = userId;
            }
        } else {
            // Users can only see their own applications
            whereClause.userId = session.user.id;
        }

        const applications = await db.jobApplication.findMany({
            where: whereClause,
            include: {
                jobPosition: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        location: true,
                        type: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        return NextResponse.json(applications);
    } catch (error) {
        console.error("Error fetching job applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        );
    }
}

// Create a new job application
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate data
        const validatedData = jobApplicationSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if job position exists and is published
        const jobPosition = await db.jobPosition.findUnique({
            where: { id: validatedData.data.jobPositionId }
        });

        if (!jobPosition) {
            return NextResponse.json(
                { error: "Job position not found" },
                { status: 404 }
            );
        }

        if (!jobPosition.isPublished) {
            return NextResponse.json(
                { error: "Job position is not available for applications" },
                { status: 400 }
            );
        }

        // Check if closing date has passed
        if (jobPosition.closingDate && new Date() > jobPosition.closingDate) {
            return NextResponse.json(
                { error: "Application period has closed" },
                { status: 400 }
            );
        }

        // Check if user has already applied for this job
        const existingApplication = await db.jobApplication.findUnique({
            where: {
                jobPositionId_userId: {
                    jobPositionId: validatedData.data.jobPositionId,
                    userId: session.user.id
                }
            }
        });

        if (existingApplication) {
            return NextResponse.json(
                { error: "You have already applied for this position" },
                { status: 400 }
            );
        }

        const application = await db.jobApplication.create({
            data: {
                ...validatedData.data,
                userId: session.user.id,
            },
            include: {
                jobPosition: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        location: true,
                        type: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error("Error creating job application:", error);
        return NextResponse.json(
            { error: "Failed to submit application" },
            { status: 500 }
        );
    }
}
