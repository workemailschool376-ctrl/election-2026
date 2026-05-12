import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep @libsql/client out of the webpack bundle so its native .node
  // binary is loaded by Node directly. We disabled Turbopack to avoid the junction crash.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

export default nextConfig;
