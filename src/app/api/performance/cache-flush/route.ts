import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        await cache.flush();
        
        return NextResponse.json({
            success: true,
            message: 'All cache cleared successfully'
        });
    } catch (error) {
        console.error('Failed to flush cache:', error);
        return NextResponse.json(
            { error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}
