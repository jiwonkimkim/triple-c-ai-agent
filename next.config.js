const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Cloudflare R2 이미지 스토리지
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // Cloudinary 이미지 스토리지
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry 조직 & 프로젝트
  org: "triple-c",
  project: "triple-c",

  // 소스맵 업로드 (SENTRY_AUTH_TOKEN이 있을 때만)
  silent: !process.env.CI,
  widenClientFileUpload: true,

  // 성능 최적화
  hideSourceMaps: true,
  disableLogger: true,

  // 자동 계측
  automaticVercelMonitors: true,

  // Auth token이 없으면 소스맵 업로드 건너뛰기 (빌드 실패 방지)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  skipEnvironmentCheck: true,
});
