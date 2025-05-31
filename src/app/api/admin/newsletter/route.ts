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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Get subscriptions with pagination
    const [subscriptions, total] = await Promise.all([
      db.newsletterSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
      }),
      db.newsletterSubscription.count({ where }),
    ]);

    // Get stats
    const stats = await db.newsletterSubscription.groupBy({
      by: ['status'],
      _count: true,
    });

    const formattedStats = {
      total: total,
      active: stats.find(s => s.status === 'ACTIVE')?._count || 0,
      unsubscribed: stats.find(s => s.status === 'UNSUBSCRIBED')?._count || 0,
      bounced: stats.find(s => s.status === 'BOUNCED')?._count || 0,
    };

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      subscriptions,
      stats: formattedStats,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Admin newsletter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
