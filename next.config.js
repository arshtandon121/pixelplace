/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
      }
    }
    return config
  },
  // Note: The url.parse() deprecation warning comes from MongoDB's library
  // This is harmless and will be fixed when MongoDB updates their dependencies
}

module.exports = nextConfig

