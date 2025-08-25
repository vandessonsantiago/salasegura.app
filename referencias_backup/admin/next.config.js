/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vandessonsantiago/ui", "@vandessonsantiago/sdk"],

  // Configurações para melhorar compatibilidade com SSE
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3002"],
    },
  },

  // Headers para CORS com backend
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
}

export default nextConfig
