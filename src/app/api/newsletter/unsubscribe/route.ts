import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendUnsubscribeConfirmationEmail } from '@/lib/email-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            return NextResponse.json(
                { error: 'Invalid unsubscribe link' },
                { status: 400 }
            );
        }

        // Find subscription by email and token
        const subscription = await db.newsletterSubscription.findFirst({
            where: {
                email: decodeURIComponent(email),
                unsubscribeToken: token,
            },
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'Invalid unsubscribe link or subscription not found' },
                { status: 404 }
            );
        }

        if (subscription.status === 'UNSUBSCRIBED') {
            return NextResponse.json(
                { message: 'You are already unsubscribed from our newsletter' },
                { status: 200 }
            );
        }        // Update subscription status
        await db.newsletterSubscription.update({
            where: { id: subscription.id },
            data: {
                status: 'UNSUBSCRIBED',
                unsubscribedAt: new Date(),
            },
        });

        // Send unsubscribe confirmation email (don't await to avoid blocking the response)
        sendUnsubscribeConfirmationEmail(subscription.email).catch(error => {
            console.error('Failed to send unsubscribe confirmation email:', error);
        });

        return NextResponse.json(
            { message: 'You have been successfully unsubscribed from our newsletter' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email address is required' },
                { status: 400 }
            );
        }

        // Find and update subscription
        const subscription = await db.newsletterSubscription.findUnique({
            where: { email },
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'Email address not found in our newsletter list' },
                { status: 404 }
            );
        }

        if (subscription.status === 'UNSUBSCRIBED') {
            return NextResponse.json(
                { message: 'You are already unsubscribed from our newsletter' },
                { status: 200 }
            );
        } await db.newsletterSubscription.update({
            where: { email },
            data: {
                status: 'UNSUBSCRIBED',
                unsubscribedAt: new Date(),
            },
        });

        // Send unsubscribe confirmation email (don't await to avoid blocking the response)
        sendUnsubscribeConfirmationEmail(email).catch(error => {
            console.error('Failed to send unsubscribe confirmation email:', error);
        });

        return NextResponse.json(
            { message: 'You have been successfully unsubscribed from our newsletter' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}
