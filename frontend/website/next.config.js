/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production build optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', 
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Production image optimizations
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers for production
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
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Allow cross-origin requests during development
  experimental: {
    allowedRevalidateHeaderKeys: ['x-vercel-cache-tags'],
    optimizePackageImports: ['lucide-react']
  },
  // ESLint configuration for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Note: Cross-origin dev requests are handled automatically in newer Next.js versions
}

module.exports = nextConfig 