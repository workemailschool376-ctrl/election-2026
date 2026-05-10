import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep @libsql/client out of the webpack bundle so its native .node
  // binary is loaded by Node directly. We disabled Turbopack to avoid the junction crash.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};


export default nextConfig;
