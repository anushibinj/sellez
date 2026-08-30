import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/backend-api/:path*", destination: `${apiProxyTarget}/api/:path*` },
      { source: "/backend-ws/:path*", destination: `${apiProxyTarget}/ws/:path*` },
    ];
  },
};

export default nextConfig;
