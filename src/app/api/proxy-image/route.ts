import { NextRequest, NextResponse } from 'next/server';

// Maximum size for proxied images in bytes (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export async function GET(request: NextRequest) {
    try {
        // Basic security check: validate referrer if in production
        if (process.env.NODE_ENV === 'production') {
            const referer = request.headers.get('referer');
            const allowedDomains = [
                'uniqverse.u6c4.sg04.idrivee2-96.com',
                'localhost',
                'uniqverse.com'
                // Add other allowed domains as needed
            ];

            // Skip the check if no referer (could be direct access) or if the referer is from allowed domains
            if (referer && !allowedDomains.some(domain => referer.includes(domain))) {
                return new NextResponse('Unauthorized', { status: 403 });
            }
        }

        // Get the URL parameter from the request
        const searchParams = request.nextUrl.searchParams;
        const imageUrl = searchParams.get('url');

        // Validate the URL parameter
        if (!imageUrl) {
            return new NextResponse('Missing URL parameter', { status: 400 });
        }

        // Prevent abuse by checking if the URL uses http/https
        const urlObj = new URL(imageUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return new NextResponse('Invalid URL protocol', { status: 400 });
        }

        // Fetch the image from the original URL with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        try {
            const response = await fetch(imageUrl, {
                headers: {
                    // Pass through user agent to avoid being blocked
                    'User-Agent': request.headers.get('user-agent') || 'NextJS Image Proxy',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear the timeout if fetch completes

            if (!response.ok) {
                return new NextResponse(`Failed to fetch image: ${response.statusText}`, {
                    status: response.status
                });
            }

            // Get the content type of the image
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                return new NextResponse('Invalid content type', { status: 400 });
            }

            // Check content length if available
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
                return new NextResponse('Image too large', { status: 413 });
            }

            // Create a buffer from the response body
            const buffer = await response.arrayBuffer();

            // Check actual size after downloading
            if (buffer.byteLength > MAX_IMAGE_SIZE) {
                return new NextResponse('Image too large', { status: 413 });
            }

            // Set appropriate cache control headers
            const headers = new Headers();
            headers.set('Content-Type', contentType);
            headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

            // Return the response with the image
            return new NextResponse(buffer, {
                headers,
                status: 200,
            });
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof DOMException && error.name === 'AbortError') {
                return new NextResponse('Request timed out', { status: 504 });
            }
            throw error; // Re-throw for outer catch
        }
    } catch (error) {
        console.error('Error proxying image:', error);

        // Provide more specific error messages for common issues
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return new NextResponse('Network error while fetching image', { status: 500 });
        }

        if (error instanceof Error && error.message.includes('URL')) {
            return new NextResponse('Invalid URL format', { status: 400 });
        }

        return new NextResponse('Error proxying image', { status: 500 });
    }
}
