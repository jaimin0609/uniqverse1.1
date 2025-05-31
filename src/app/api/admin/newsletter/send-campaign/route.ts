import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendNewsletterCampaign } from '@/lib/newsletter-utils';
import { z } from 'zod';

const campaignSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    content: z.string().min(1, 'Content is required'),
    senderName: z.string().optional().default('Uniqverse'),
});

export async function POST(request: NextRequest) {
    try {
        // Check if user is admin
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { subject, content, senderName } = campaignSchema.parse(body);

        // Send the newsletter campaign
        const result = await sendNewsletterCampaign({
            subject,
            content,
            senderName,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Newsletter campaign API error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
