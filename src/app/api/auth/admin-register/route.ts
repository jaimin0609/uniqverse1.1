import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

// Admin registration code (should be in env variables in production)
const ADMIN_REGISTRATION_CODE = "UNIQVERSE-ADMIN-2025";

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const { name, email, password, registrationCode } = await req.json();

        // Validate required fields
        if (!name || !email || !password || !registrationCode) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return NextResponse.json(
                { message: "Password must contain uppercase, lowercase, and numbers" },
                { status: 400 }
            );
        }

        // Verify registration code
        if (registrationCode !== ADMIN_REGISTRATION_CODE) {
            return NextResponse.json(
                { message: "Invalid registration code" },
                { status: 403 }
            );
        }

        // Check if user with this email already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create new admin user
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "ADMIN" // Using the correct enum value from UserRole
            }
        });

        // Return success without exposing sensitive user data
        return NextResponse.json(
            {
                message: "Admin user registered successfully",
                userId: user.id
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Admin registration error:", error);

        return NextResponse.json(
            { message: "An error occurred during registration" },
            { status: 500 }
        );
    }
}