/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://storytopia-backend-700174635185.us-central1.run.app',
  },
}

module.exports = nextConfig
