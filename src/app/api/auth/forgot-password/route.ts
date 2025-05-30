import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email-utils";

// This sets how long the reset token is valid for
const TOKEN_EXPIRATION_HOURS = 24;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body with zod schema
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid email address" },
                { status: 400 }
            );
        }

        const { email } = body;

        // Look up the user by email
        const user = await db.user.findUnique({
            where: { email },
        });

        // Always return success, even if the email doesn't exist in the system
        // This prevents user enumeration attacks
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return NextResponse.json(
                { message: "If your email is registered, you'll receive a reset link shortly" },
                { status: 200 }
            );
        }

        // Generate random token
        const token = crypto.randomBytes(32).toString("hex");

        // Calculate expiration time
        const expires = new Date();
        expires.setHours(expires.getHours() + TOKEN_EXPIRATION_HOURS);

        // Store the token in the database
        await db.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
                userId: user.id,
            },
        });

        // Send the reset email
        await sendPasswordResetEmail(email, token);

        console.log(`Password reset link sent to: ${email}`);
        return NextResponse.json(
            { message: "Password reset link sent" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset request error:", error);
        return NextResponse.json(
            { message: "Failed to process password reset request" },
            { status: 500 }
        );
    }
}
