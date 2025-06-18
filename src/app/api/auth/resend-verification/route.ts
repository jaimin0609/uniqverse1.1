import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email-utils";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        // Find the user
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal whether the email exists for security
            return NextResponse.json(
                { message: "If the email exists in our system, a verification email has been sent." },
                { status: 200 }
            );
        }

        // Check if email is already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: "Email is already verified" },
                { status: 400 }
            );
        }

        // Delete any existing verification tokens for this user
        await db.verificationToken.deleteMany({
            where: {
                OR: [
                    { identifier: email },
                    { userId: user.id }
                ]
            }
        });

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // Expires in 24 hours

        // Create new verification token
        await db.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires: verificationExpires,
                userId: user.id,
            },
        });

        // Send verification email (don't await to avoid blocking the response)
        sendEmailVerificationEmail(user.email, verificationToken, user.name || undefined).catch(error => {
            console.error('Failed to send email verification email:', error);
        });

        return NextResponse.json(
            { message: "If the email exists in our system, a verification email has been sent." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Resend verification error:", error);
        return NextResponse.json(
            { message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
