import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cache, cacheInvalidation } from "@/lib/redis";
import { hashObject } from "@/lib/utils";

// Get all users (with pagination, sorting, and filtering)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search") || "";
        const role = url.searchParams.get("role") || "";
        const sortField = url.searchParams.get("sort") || "createdAt";
        const sortOrder = url.searchParams.get("order") || "desc";

        // Create cache key based on query parameters
        const queryParams = { page, limit, search, role, sortField, sortOrder };
        const cacheKey = `admin:users:${hashObject(queryParams)}`;

        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Prepare filter conditions
        const filterConditions: any = {};

        if (search) {
            filterConditions.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            filterConditions.role = role;
        }

        // Count total users matching the filters
        const totalUsers = await db.user.count({
            where: filterConditions,
        });

        // Calculate pagination
        const totalPages = Math.ceil(totalUsers / limit);
        const skip = (page - 1) * limit;

        // Get users with pagination, sorting, and filtering
        const users = await db.user.findMany({
            where: filterConditions,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
            orderBy: {
                [sortField]: sortOrder,
            },
            skip,
            take: limit,
        });        // Cache the response for 5 minutes (user data changes moderately)
        const response = {
            users,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages,
            },
        };
        await cache.set(cacheKey, response, 300);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// Create a new user (admin functionality)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        if (!data.password || data.password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (data.role && !["USER", "ADMIN"].includes(data.role)) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        // Check if email is already in use
        const existingUser = await db.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email is already in use" },
                { status: 400 }
            );
        }

        // Hash the password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(data.password, 10);        // Create the user
        const user = await db.user.create({
            data: {
                name: data.name.trim(),
                email: data.email.trim(),
                password: hashedPassword,
                role: data.role || "USER",
                image: data.image || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
            },
        });

        // Invalidate admin users cache after creating a new user
        await cacheInvalidation.onAdminUsersChange();

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}