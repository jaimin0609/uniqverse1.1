import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        const email = url.searchParams.get("email");

        if (!token || !email) {
            return NextResponse.json(
                { message: "Missing token or email" },
                { status: 400 }
            );
        }

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

        return NextResponse.json(
            { message: "Token is valid" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Token verification error:", error);
        return NextResponse.json(
            { message: "Failed to verify token" },
            { status: 500 }
        );
    }
}
