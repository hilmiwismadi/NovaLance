/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: optimizeFonts is now enabled by default in Next.js 15+
  // Webpack config removed to avoid Turbopack conflicts
  // If you need the async-storage fallback, it should work natively now

  // Hide all Next.js dev indicators
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
    appIsrStatus: false,
  },

  // Configure images for local public folder
  images: {
    unoptimized: false,
    remotePatterns: [],
    domains: [],
  },

  // Disable Next.js Dev Tools overlay
  experimental: {
    devTools: false,
  },

  // Disable the Next.js logo in bottom-right corner
  webpack: (config, { dev, isServer }) => {
    // Disable Next.js DevTools in production
    if (!dev && !isServer) {
      config.devtool = false;
    }
    return config;
  },
}

module.exports = nextConfig

