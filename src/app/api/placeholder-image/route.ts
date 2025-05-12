import { NextRequest, NextResponse } from "next/server";

// Simple API endpoint to generate a placeholder image on demand
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get('width') || '300');
    const height = parseInt(searchParams.get('height') || '300');
    const text = searchParams.get('text') || 'No Image';

    // Create an SVG placeholder with the specified dimensions and text
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e2e8f0"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" 
                  fill="#64748b" text-anchor="middle" dominant-baseline="middle">
                ${text}
            </text>
        </svg>
    `;

    // Convert the SVG to a buffer
    const svgBuffer = Buffer.from(svg);

    // Return the SVG as an image
    return new NextResponse(svgBuffer, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}