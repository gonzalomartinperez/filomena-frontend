import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // Cualquier host HTTPS que sirva bajo /storage/**
      { protocol: 'https', hostname: '**', pathname: '/storage/**' },

      // Dev/local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
}

export default nextConfig
