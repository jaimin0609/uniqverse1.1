import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const jobPositionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    department: z.string().min(1, "Department is required"),
    location: z.string().min(1, "Location is required"),
    type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"]),
    description: z.string().min(50, "Description must be at least 50 characters"),
    requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
    benefits: z.array(z.string()).optional().default([]),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    closingDate: z.string().optional(),
    isPublished: z.boolean().default(false),
});

// Get all published job positions
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const isAdmin = url.searchParams.get('admin') === 'true';

        // If admin view, check authentication
        if (isAdmin) {
            const session = await getServerSession(authOptions);
            if (!session?.user || session.user.role !== "ADMIN") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const jobs = await db.jobPosition.findMany({
            where: isAdmin ? {} : { isPublished: true },
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching job positions:", error);
        return NextResponse.json(
            { error: "Failed to fetch job positions" },
            { status: 500 }
        );
    }
}

// Create a new job position (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate data
        const validatedData = jobPositionSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        const jobData = {
            ...validatedData.data,
            closingDate: validatedData.data.closingDate
                ? new Date(validatedData.data.closingDate)
                : null,
        };

        const job = await db.jobPosition.create({
            data: jobData,
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        console.error("Error creating job position:", error);
        return NextResponse.json(
            { error: "Failed to create job position" },
            { status: 500 }
        );
    }
}
