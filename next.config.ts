import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL ships native bindings, so it has to stay a real Node module instead
  // of being bundled into the server build.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Every screen reads live order state from SQLite or a polling API, so the
  // prototype opts out of static prerendering instead of caching data at build.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
