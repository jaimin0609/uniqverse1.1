import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, email } = body;

        if (!token || !email) {
            return NextResponse.json(
                { message: "Missing token or email" },
                { status: 400 }
            );
        }

        console.log("Email verification attempt:", { email, tokenProvided: !!token });

        // Find the verification token
        const verificationToken = await db.verificationToken.findFirst({
            where: {
                token: token,
                identifier: email,
                expires: {
                    gt: new Date(), // Token must not be expired
                },
            },
        });

        if (!verificationToken) {
            console.log("Invalid or expired verification token:", { email, token });
            return NextResponse.json(
                { message: "Invalid or expired verification link" },
                { status: 400 }
            );
        }

        // Find the user
        const user = await db.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            console.log("User not found for email:", email);
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (user.emailVerified) {
            console.log("Email already verified:", email);
            // Delete the token since it's no longer needed
            await db.verificationToken.delete({
                where: { token: verificationToken.token },
            });

            return NextResponse.json(
                { message: "Email is already verified", alreadyVerified: true },
                { status: 200 }
            );
        }

        // Update user to mark email as verified
        await db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
        });

        // Delete the verification token
        await db.verificationToken.delete({
            where: { token: verificationToken.token },
        });

        console.log("Email verification successful:", email);

        return NextResponse.json(
            {
                message: "Email verified successfully!",
                verified: true
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.json(
            { message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
