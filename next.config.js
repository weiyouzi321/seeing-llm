/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // 静态导出仅在生产环境启用，避免 dev 报错
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // GitHub Pages 子路径：CI 时为 /seeing-llm；本地为空
  basePath: typeof process.env.BASE_PATH !== 'undefined' ? process.env.BASE_PATH : '',
  assetPrefix: process.env.BASE_PATH || '',
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config;
  },
}

module.exports = nextConfig