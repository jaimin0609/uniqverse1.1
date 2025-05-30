import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { newPasswordSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const result = newPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    message: "Invalid input data",
                    errors: result.error.format()
                },
                { status: 400 }
            );
        }

        const { token, email, password } = body;

        // Find the token in the database
        const verificationToken = await db.verificationToken.findFirst({
            where: {
                identifier: email,
                token,
                expires: {
                    gt: new Date() // Check if token is not expired
                }
            }
        });

        if (!verificationToken) {
            return NextResponse.json(
                { message: "Invalid or expired token" },
                { status: 400 }
            );
        }

        // Find the user by email
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Hash the new password
        const hashedPassword = await hash(password, 12);

        // Update the user's password
        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Delete the verification token to prevent reuse
        await db.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token
                }
            }
        });

        return NextResponse.json(
            { message: "Password reset successful" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json(
            { message: "Failed to reset password" },
            { status: 500 }
        );
    }
}
