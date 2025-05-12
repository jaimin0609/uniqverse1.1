import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy endpoint that fetches external images and serves them through our domain
 * This bypasses Next.js image domain restrictions completely
 */
export async function GET(request: NextRequest) {
    try {
        // Get the image URL from the query parameters
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        // Validate the URL
        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Decode the URL if it's encoded
        const decodedUrl = decodeURIComponent(imageUrl);

        // Fetch the image from the external source
        const imageResponse = await fetch(decodedUrl, {
            headers: {
                // Set a user agent to avoid being blocked by some image servers
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Check if the fetch was successful
        if (!imageResponse.ok) {
            // If not, return our placeholder image
            return NextResponse.redirect(new URL('/api/placeholder-image?text=Error+Loading+Image', request.url));
        }

        // Get the image data
        const imageData = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Return the image with appropriate headers
        return new NextResponse(imageData, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        // Redirect to placeholder image on error
        return NextResponse.redirect(new URL('/api/placeholder-image?text=Error+Loading+Image', request.url));
    }
}