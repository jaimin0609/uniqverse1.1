const withPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable TypeScript checking for production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable CSS optimization
  experimental: {
    optimizeCss: true,
  },
  // Production security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },images: {
    domains: [
      'localhost',
      'placehold.co',
      'picsum.photos',
      'images.unsplash.com',
      'res.cloudinary.com',
      'cdn.jsdelivr.net',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'uniqverse.u6c4.sg04.idrivee2-96.com',
      'oss-cf.cjdropshipping.com', // CJ Dropshipping OSS CDN
      'cf.cjdropshipping.com', // CJ Dropshipping CF CDN
      'img.cjdropshipping.com', // CJ Dropshipping Image CDN
      'cjdropshipping.com', // Main CJ domain for any future subdomain changes
      'img01.cjdropshipping.com', // Additional numbered subdomains
      'img02.cjdropshipping.com',
      'img03.cjdropshipping.com',
      'cbu01.alicdn.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.idrivee2-96.com', // Add iDrive e2 pattern for future subdomains
      },
      {
        protocol: 'https',
        hostname: '**.cjdropshipping.com', // Wildcard pattern for all CJ Dropshipping subdomains
      },
      // Allow images from common image hosting services
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '**.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    // Set a reasonable image size limit for performance
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Allow connections from any host
  webpack: (config) => {
    // Adding the watchOptions directly in webpack config instead of webpackDevMiddleware
    if (process.env.NODE_ENV === 'development') {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Adding headers for CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

// Export the configuration with PWA wrapper
module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);