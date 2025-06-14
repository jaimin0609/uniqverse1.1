import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patterns = ['homepage', 'products', 'categories'] } = body;
        
        await cache.preloadCache(patterns);
        
        return NextResponse.json({
            success: true,
            message: `Cache preloading initiated for patterns: ${patterns.join(', ')}`
        });
    } catch (error) {
        console.error('Failed to preload cache:', error);
        return NextResponse.json(
            { error: 'Failed to preload cache' },
            { status: 500 }
        );
    }
}
