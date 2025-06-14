import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        await cache.warmCache();
        
        return NextResponse.json({
            success: true,
            message: 'Cache warming initiated successfully'
        });
    } catch (error) {
        console.error('Failed to warm cache:', error);
        return NextResponse.json(
            { error: 'Failed to warm cache' },
            { status: 500 }
        );
    }
}
