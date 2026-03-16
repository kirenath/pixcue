import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        // R2 公开域名
        protocol: "https",
        hostname: "img.pixcue.kirenath.com",
      },
    ],
  },
};

export default nextConfig;
