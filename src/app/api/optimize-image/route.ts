import { NextRequest, NextResponse } from 'next/server';
import { imageOptimizer } from '@/lib/image-optimizer';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Get optimization options from request
        const quality = parseInt(formData.get('quality') as string) || 85;
        const format = (formData.get('format') as string) || 'webp';
        const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
        const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;

        // Process the image
        const optimizedImageSet = await imageOptimizer.processImage(
            buffer,
            file.name,
            {
                quality,
                format: format as 'webp' | 'avif' | 'jpeg' | 'png',
                width,
                height,
                progressive: true,
                removeMetadata: true
            }
        );

        return NextResponse.json({
            success: true,
            data: optimizedImageSet
        });

    } catch (error) {
        console.error('Image optimization failed:', error);
        return NextResponse.json(
            { error: 'Failed to optimize image' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Return optimization statistics
        const stats = await imageOptimizer.getOptimizationStats();
        return NextResponse.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Failed to get optimization stats:', error);
        return NextResponse.json(
            { error: 'Failed to get statistics' },
            { status: 500 }
        );
    }
}
