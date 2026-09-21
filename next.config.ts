import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

function contentSecurityPolicy(frameAncestors: string): string {
  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const commonHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/widget",
        headers: [
          ...commonHeaders,
          { key: "Cache-Control", value: "private, no-store" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy("*"),
          },
        ],
      },
      {
        source: "/((?!widget$).*)",
        headers: [
          ...commonHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy("'none'"),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
