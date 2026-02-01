/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for Netlify deployment with dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@supabase\/(auth-js|functions-js|realtime-js|storage-js)/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
