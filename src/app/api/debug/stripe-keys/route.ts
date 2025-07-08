import { NextResponse } from "next/server";

export async function GET() {
    // Temporarily allow in production for debugging (remove after fixing)
    // if (process.env.NODE_ENV !== 'development') {
    //     return NextResponse.json({ error: "Only available in development" }, { status: 403 });
    // }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    return NextResponse.json({
        secretKeyExists: !!stripeSecretKey,
        secretKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + "..." : "NOT_FOUND",
        publishableKeyExists: !!stripePublishableKey,
        publishableKeyPrefix: stripePublishableKey ? stripePublishableKey.substring(0, 7) + "..." : "NOT_FOUND",
        nodeEnv: process.env.NODE_ENV,
    });
}
