import { dirname } from "path";
import { fileURLToPath } from "url";

// Bundle analyzer (optional)
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? (await import("@next/bundle-analyzer")).default({
        enabled: true,
      })
    : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce hydration warnings
  images: {
    domains: [
      "i.postimg.cc",
      "vjveipltkwxnndrencbf.supabase.co",
      "vrrcgzafznjbdzpvciui.supabase.co",
      "res.cloudinary.com",
      "images.unsplash.com",
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vrrcgzafznjbdzpvciui.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'vjveipltkwxnndrencbf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enhanced optimization for Vercel deployment
  compress: true,
  poweredByHeader: false,

  // Reduce serverless function sizes - simplified to avoid build issues
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/helpers/**/*",
      "node_modules/react-icons/gi/**/*",
      "node_modules/react-icons/pi/**/*",
      "node_modules/react-icons/si/**/*",
      "node_modules/react-icons/tb/**/*",
      "node_modules/react-icons/hi2/**/*",
      "node_modules/react-icons/di/**/*",
      "node_modules/react-icons/gr/**/*",
      "node_modules/react-icons/cg/**/*",
      "node_modules/react-icons/io/**/*",
      "node_modules/react-icons/tb/**/*",
    ],
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default withBundleAnalyzer(nextConfig);
