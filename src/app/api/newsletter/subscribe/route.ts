import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNewsletterWelcomeEmail } from '@/lib/email-utils';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const subscribeSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    source: z.string().optional().default('homepage'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, source } = subscribeSchema.parse(body);

        // Check if email already exists
        const existingSubscription = await db.newsletterSubscription.findUnique({
            where: { email },
        });

        if (existingSubscription) {
            if (existingSubscription.status === 'ACTIVE') {
                return NextResponse.json(
                    { message: 'You are already subscribed to our newsletter!' },
                    { status: 200 }
                );
            } else if (existingSubscription.status === 'UNSUBSCRIBED') {
                // Reactivate subscription
                const unsubscribeToken = randomBytes(32).toString('hex');

                await db.newsletterSubscription.update({
                    where: { email },
                    data: {
                        status: 'ACTIVE',
                        subscribedAt: new Date(),
                        unsubscribedAt: null,
                        unsubscribeToken,
                        source,
                    },
                });

                // Send welcome email
                await sendNewsletterWelcomeEmail(email, unsubscribeToken);

                return NextResponse.json(
                    { message: 'Welcome back! You have been re-subscribed to our newsletter.' },
                    { status: 200 }
                );
            }
        }

        // Create new subscription
        const unsubscribeToken = randomBytes(32).toString('hex');

        await db.newsletterSubscription.create({
            data: {
                email,
                unsubscribeToken,
                source,
                status: 'ACTIVE',
            },
        });

        // Send welcome email
        await sendNewsletterWelcomeEmail(email, unsubscribeToken);

        return NextResponse.json(
            { message: 'Thank you for subscribing to our newsletter!' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Newsletter subscription error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}
