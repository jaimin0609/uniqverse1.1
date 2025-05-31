import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Check if user is admin
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all active subscribers
        const subscribers = await db.newsletterSubscription.findMany({
            where: { status: 'ACTIVE' },
            select: {
                email: true,
                subscribedAt: true,
                source: true,
            },
            orderBy: { subscribedAt: 'desc' },
        });

        // Generate CSV content
        const csvHeaders = ['Email', 'Subscribed Date', 'Source'];
        const csvRows = subscribers.map(sub => [
            sub.email,
            new Date(sub.subscribedAt).toISOString().split('T')[0],
            sub.source || 'Unknown'
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        console.error('Newsletter export error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
