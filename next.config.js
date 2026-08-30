const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle external packages
  serverExternalPackages: [],
  // Allow cross-origin requests from local network IPs during development
  allowedDevOrigins: [
    "192.168.101.10",
    "192.168.101.11", // Current server IP
    "192.168.1.*", // Common home network range
    "192.168.0.*", // Common router default range
    "10.0.0.*", // Private network range
    "172.16.*", // Private network range
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
  ],
  // Suppress hydration warnings for browser extensions
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Bundle optimization (only for production builds)
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack optimizations in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    return config;
  },
  // Handle cross-origin requests
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
