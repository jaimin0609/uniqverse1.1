import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cacheInvalidation } from "@/lib/redis";

// Get a specific user
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                orders: {
                    take: 5,
                    orderBy: {
                        createdAt: "desc",
                    },
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// Update a user
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
        const data = await request.json();

        // Validate the data
        if (!data.name || data.name.trim() === "") {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        if (!data.email || !data.email.includes("@")) {
            return NextResponse.json(
                { error: "Valid email is required" },
                { status: 400 }
            );
        }

        if (data.role && !["USER", "ADMIN"].includes(data.role)) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if email is already taken by another user
        if (data.email !== existingUser.email) {
            const emailExists = await db.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: userId },
                },
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: "Email is already in use" },
                    { status: 400 }
                );
            }
        }        // Update the user
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                name: data.name.trim(),
                email: data.email.trim(),
                role: data.role || existingUser.role,
                image: data.image || existingUser.image,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
            },
        });

        // Invalidate admin users cache after updating
        await cacheInvalidation.onAdminUsersChange();

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// Delete a user
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;

        // Prevent admin from deleting themselves
        if (session.user.id === userId) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Optional: Check if user has orders and prevent deletion
        if (existingUser._count.orders > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete user with orders",
                    details: `This user has ${existingUser._count.orders} orders`
                },
                { status: 400 }
            );
        }        // Delete the user
        await db.user.delete({
            where: { id: userId },
        });

        // Invalidate admin users cache after deletion
        await cacheInvalidation.onAdminUsersChange();

        return NextResponse.json(
            { message: "User deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}