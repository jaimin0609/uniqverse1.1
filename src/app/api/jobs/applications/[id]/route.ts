import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const applicationUpdateSchema = z.object({
    status: z.enum([
        "PENDING", "REVIEWING", "INTERVIEWED", "OFFERED", "ACCEPTED", "REJECTED", "WITHDRAWN"
    ]).optional(),
    notes: z.string().optional(),
});

// Get a specific job application
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const application = await db.jobApplication.findUnique({
            where: { id: params.id },
            include: {
                jobPosition: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        location: true,
                        type: true,
                        description: true
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
            }
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Users can only view their own applications, admins can view all
        if (session.user.role !== "ADMIN" && application.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(application);
    } catch (error) {
        console.error("Error fetching job application:", error);
        return NextResponse.json(
            { error: "Failed to fetch application" },
            { status: 500 }
        );
    }
}

// Update a job application (Admin only for status changes)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate data
        const validatedData = applicationUpdateSchema.safeParse(data);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        // Check if application exists
        const existingApplication = await db.jobApplication.findUnique({
            where: { id: params.id },
            include: {
                jobPosition: {
                    select: {
                        title: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!existingApplication) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        const updateData: any = {
            ...validatedData.data,
            updatedAt: new Date()
        };

        // If status is being changed, set reviewer and review date
        if (validatedData.data.status && validatedData.data.status !== existingApplication.status) {
            updateData.reviewedBy = session.user.id;
            updateData.reviewedAt = new Date();
        }

        const application = await db.jobApplication.update({
            where: { id: params.id },
            data: updateData,
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
            }
        });

        return NextResponse.json(application);
    } catch (error) {
        console.error("Error updating job application:", error);
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        );
    }
}

// Delete/withdraw a job application
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const application = await db.jobApplication.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true
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

        // Users can only withdraw their own applications, admins can delete any
        if (session.user.role !== "ADMIN" && application.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // For users, mark as withdrawn instead of deleting
        if (session.user.role !== "ADMIN") {
            await db.jobApplication.update({
                where: { id: params.id },
                data: {
                    status: "WITHDRAWN",
                    updatedAt: new Date()
                }
            });

            return NextResponse.json({
                message: "Application withdrawn successfully"
            });
        }

        // Admins can delete the application
        await db.jobApplication.delete({
            where: { id: params.id }
        });

        return NextResponse.json({
            message: "Application deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting job application:", error);
        return NextResponse.json(
            { error: "Failed to delete application" },
            { status: 500 }
        );
    }
}
