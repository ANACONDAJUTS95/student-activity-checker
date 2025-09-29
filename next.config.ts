import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/student-activity-checker',
  assetPrefix: '/student-activity-checker/',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
  transpilePackages: ['pdfjs-dist']
};

export default nextConfig;
