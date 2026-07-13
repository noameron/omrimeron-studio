import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    // Old WordPress paths → new short routes (owner decision, 2026-07-11:
    // paths are the category's leading word). Keeps existing inbound links
    // and search results resolving. Trailing-slash variants are normalized
    // by Next.js defaults.
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/about-the-studio', destination: '/about', permanent: true },
      { source: '/packshots', destination: '/products', permanent: true },
      { source: '/wine-more', destination: '/wine', permanent: true },
      { source: '/life-style', destination: '/life', permanent: true },
      { source: '/holiday-cards', destination: '/holiday', permanent: true },
      { source: '/our-clients', destination: '/clients', permanent: true },
      {
        // Legacy Industry URL arrives percent-encoded; redirect sources are
        // matched against the encoded path, so spell it out encoded.
        source: `/${encodeURIComponent('צילום-תעשיה-עמרי-מירון')}`,
        destination: '/industry',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
