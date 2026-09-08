import type { NextConfig } from "next";

// The browser talks to the Spring Boot backend directly (see src/lib/config.ts and
// NEXT_PUBLIC_BACKEND_URL) — there is no rewrite/proxy here.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
