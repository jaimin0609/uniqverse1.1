import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const jobUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    department: z.string().min(1, "Department is required").optional(),
    location: z.string().min(1, "Location is required").optional(),
    type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"]).optional(),
    description: z.string().min(50, "Description must be at least 50 characters").optional(),
    requirements: z.array(z.string()).min(1, "At least one requirement is needed").optional(),
    benefits: z.array(z.string()).optional(),
    salaryMin: z.number().positive().optional().nullable(),
    salaryMax: z.number().positive().optional().nullable(),
    closingDate: z.string().optional().nullable(),
    isPublished: z.boolean().optional(),
});

// Get a specific job position
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const job = await db.jobPosition.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job position not found" },
                { status: 404 }
            );
        }

        // If job is not published, only admin can view it
        if (!job.isPublished) {
            const session = await getServerSession(authOptions);
            if (!session?.user || session.user.role !== "ADMIN") {
                return NextResponse.json(
                    { error: "Job position not found" },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error fetching job position:", error);
        return NextResponse.json(
            { error: "Failed to fetch job position" },
            { status: 500 }
        );
    }
}

// Update a job position (Admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate data
        const validatedData = jobUpdateSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if job exists
        const existingJob = await db.jobPosition.findUnique({
            where: { id: params.id }
        });

        if (!existingJob) {
            return NextResponse.json(
                { error: "Job position not found" },
                { status: 404 }
            );
        } const updateData: any = {
            ...validatedData.data,
        };

        // Handle closingDate conversion
        if (validatedData.data.closingDate !== undefined) {
            updateData.closingDate = validatedData.data.closingDate
                ? new Date(validatedData.data.closingDate)
                : null;
        }

        const job = await db.jobPosition.update({
            where: { id: params.id },
            data: updateData,
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        });

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error updating job position:", error);
        return NextResponse.json(
            { error: "Failed to update job position" },
            { status: 500 }
        );
    }
}

// Delete a job position (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if job exists
        const existingJob = await db.jobPosition.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        });

        if (!existingJob) {
            return NextResponse.json(
                { error: "Job position not found" },
                { status: 404 }
            );
        }

        // Check if there are applications
        if (existingJob._count.applications > 0) {
            return NextResponse.json(
                { error: "Cannot delete job position with applications. Archive it instead." },
                { status: 400 }
            );
        }

        await db.jobPosition.delete({
            where: { id: params.id }
        });

        return NextResponse.json({
            message: "Job position deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting job position:", error);
        return NextResponse.json(
            { error: "Failed to delete job position" },
            { status: 500 }
        );
    }
}
