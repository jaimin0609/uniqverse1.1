import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET - Fetch current user's account information
export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get user from database excluding sensitive fields
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password and other sensitive fields
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user account:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching account information" },
            { status: 500 }
        );
    }
}

// PUT - Update user account information
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const { name, email, currentPassword, newPassword } = await req.json();

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { message: "Name and email are required" },
                { status: 400 }
            );
        }

        // Get current user
        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {
            name,
            email,
        };

        // If changing password
        if (newPassword) {
            // Verify current password if provided
            if (!currentPassword) {
                return NextResponse.json(
                    { message: "Current password is required to change password" },
                    { status: 400 }
                );
            }

            // Check if current password is correct
            if (user.password) {
                const isPasswordValid = await compare(currentPassword, user.password);
                if (!isPasswordValid) {
                    return NextResponse.json(
                        { message: "Current password is incorrect" },
                        { status: 400 }
                    );
                }
            }

            // Hash new password
            updateData.password = await hash(newPassword, 12);
        }

        // Check if email is changing and if it's already taken
        if (email !== user.email) {
            const existingUser = await db.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return NextResponse.json(
                    { message: "Email is already in use" },
                    { status: 400 }
                );
            }
        }

        // Update user
        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password and other sensitive fields
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user account:", error);
        return NextResponse.json(
            { message: "An error occurred while updating account information" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user account
export async function DELETE() {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Delete user - this will also delete related data due to cascading deletes
        // defined in the schema
        await db.user.delete({
            where: { id: user.id }
        });

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting user account:", error);
        return NextResponse.json(
            { message: "An error occurred while deleting your account" },
            { status: 500 }
        );
    }
}