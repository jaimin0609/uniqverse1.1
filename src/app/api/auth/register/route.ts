import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { sendEmailVerificationEmail } from "@/lib/email-utils";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("Registration attempt with data:", {
            name: body.name,
            email: body.email,
            passwordLength: body.password?.length,
            confirmPasswordLength: body.confirmPassword?.length,
            // Don't log the actual passwords for security
        });

        // Validate request body
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            // Detailed error logging
            console.error("Validation failed with errors:",
                JSON.stringify(result.error.format(), null, 2)
            );

            return NextResponse.json(
                {
                    message: "Invalid input data",
                    errors: result.error.format()
                },
                { status: 400 }
            );
        }

        const { name, email, password } = body;

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log("User already exists:", email);
            return NextResponse.json(
                { message: "Email already registered. Please sign in instead." },
                { status: 409 }
            );
        }        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // Expires in 24 hours

        // Create new user (emailVerified will be null until verified)
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "CUSTOMER", // Default role
                emailVerified: null, // User needs to verify their email
            },
        });

        // Create verification token
        await db.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires: verificationExpires,
                userId: user.id,
            },
        });        // Create empty cart for the user
        await db.cart.create({
            data: {
                id: crypto.randomUUID(),
                userId: user.id,
                updatedAt: new Date(),
            },
        });

        // Send email verification email (don't await to avoid blocking the response)
        sendEmailVerificationEmail(user.email, verificationToken, user.name || undefined).catch(error => {
            console.error('Failed to send email verification email:', error);
        });

        // Return success response (omit password from response)
        const { password: _, ...userWithoutPassword } = user;
        console.log("User created successfully:", email);

        const response = NextResponse.json(
            {
                message: "Account created successfully! Please check your email to verify your account.",
                user: userWithoutPassword
            },
            { status: 201 }
        );

        // Force the status code
        response.headers.set('x-status-code', '201');

        return response;
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}