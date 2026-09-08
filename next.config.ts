import type { NextConfig } from 'next';

// The reader intentionally accepts textbook PDFs. Vinext otherwise inherits
// Next's 1 MB action-body ceiling before the upload route can inspect a file.
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
};

export default nextConfig;
