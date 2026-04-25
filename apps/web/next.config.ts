import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@daterra/shared', '@daterra/database', '@daterra/ui'],
};

export default nextConfig;
