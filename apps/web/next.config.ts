import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@viralytics/core'],
  // Keep heavy server-only deps out of the client/edge bundles (Next 15 key).
  serverExternalPackages: ['bullmq', 'ioredis'],
  images: {
    // Platform thumbnails are remote and host-varied; allow https hosts.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
