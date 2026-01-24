/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for Netlify deployment with dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
