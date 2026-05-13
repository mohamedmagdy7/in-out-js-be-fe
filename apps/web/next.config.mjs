const API_URL =
  process.env.API_URL ||
  (process.env.VERCEL ? "https://in-out-js-be-fe.onrender.com" : "http://localhost:4000");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/shared"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
