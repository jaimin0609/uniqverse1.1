import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This middleware will run on admin and vendor routes
export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Handle admin routes
    if (path.startsWith('/admin') && path !== '/admin/direct') {
        // Skip middleware for API routes within admin to prevent redirect loops
        if (path.startsWith('/admin/api/')) {
            return NextResponse.next()
        }

        // Get the token from the request
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        })

        console.log("Middleware checking admin access:", {
            path,
            hasToken: !!token,
            role: token?.role,
            email: token?.email
        })

        // If user is not logged in or doesn't have admin role, redirect to login or homepage
        if (!token) {
            // Not logged in - redirect to login with callback
            const url = new URL(`/auth/login`, request.url)
            url.searchParams.set('callbackUrl', encodeURI('/admin'))
            console.log("Redirecting to login:", url.toString())
            return NextResponse.redirect(url)
        }

        // Check if the user has admin role
        if (token.role !== 'ADMIN') {
            // Not an admin - redirect to homepage
            console.log("User is not admin, redirecting to homepage")
            return NextResponse.redirect(new URL('/', request.url))
        }

        // Allow access for admin users
        console.log("Admin access granted for:", token.email)
        return NextResponse.next()
    }// Handle vendor routes (vendor application is now at /careers/vendor, so all /vendor routes require auth)
    if (path.startsWith('/vendor')) {
        // Get the token from the request
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        })

        console.log("Middleware checking vendor access:", {
            path,
            hasToken: !!token,
            role: token?.role,
            email: token?.email
        })

        // If user is not logged in, redirect to login with callback
        if (!token) {
            const url = new URL(`/auth/login`, request.url)
            url.searchParams.set('callbackUrl', encodeURI(path))
            return NextResponse.redirect(url)
        }

        // Check if the user has vendor role
        if (token.role !== 'VENDOR') {
            // Not a vendor - redirect to homepage
            return NextResponse.redirect(new URL('/', request.url))
        }

        // Allow access for vendor users
        console.log("Vendor access granted for:", token.email)
        return NextResponse.next()
    }

    // Allow all other routes
    return NextResponse.next()
}

// Configure the middleware to run only on specific paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/admin/:path*',
        '/vendor/:path*'
    ]
}