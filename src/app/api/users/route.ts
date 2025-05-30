import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { cache } from "@/lib/redis";


// Schema for user profile updates
const userProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    image: z.string().url("Invalid image URL").optional().nullable(),
});

// GET - Get user profile
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const cacheKey = `user:profile:${session.user.id}`;

        // Try to get from cache first
        const cachedProfile = await cache.get(cacheKey);
        if (cachedProfile) {
            return NextResponse.json({ user: cachedProfile });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                addresses: {
                    orderBy: { isDefault: 'desc' },
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5, // Latest 5 orders
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        slug: true,
                                        images: {
                                            take: 1,
                                            select: { url: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                UserSecuritySettings: true,
            }
        }); if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Cache the user profile for 30 minutes
        await cache.set(cacheKey, user, 1800);

        return NextResponse.json({ user });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { message: "Failed to fetch user profile" },
            { status: 500 }
        );
    }
}

// PATCH - Update user profile
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validationResult = userProfileSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid profile data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const userData = validationResult.data; const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                ...userData,
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
                updatedAt: true
            }
        });

        // Invalidate user profile cache
        const cacheKey = `user:profile:${session.user.id}`;
        await cache.del(cacheKey);

        return NextResponse.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
            { message: "Failed to update profile" },
            { status: 500 }
        );
    }
}