import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    // Old WP menu URL for the home page (contracts/routes.md). Trailing-slash
    // variants of every other route are normalized by Next.js defaults.
    return [{ source: '/home', destination: '/', permanent: true }]
  },
}

export default nextConfig
