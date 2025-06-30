/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['canaryride.booqable.com', 'api.whiparound.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig; 