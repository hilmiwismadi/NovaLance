/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: optimizeFonts is now enabled by default in Next.js 15+
  // Webpack config removed to avoid Turbopack conflicts
  // If you need the async-storage fallback, it should work natively now
  experimental: {
    serverComponentsExternalPackages: ['@react-native-async-storage/async-storage'],
  },
}

module.exports = nextConfig
