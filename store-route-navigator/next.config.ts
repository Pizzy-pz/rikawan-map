import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  // クリックジャッキング攻撃を防ぐ
  { key: "X-Frame-Options", value: "DENY" },
  // MIMEタイプスニッフィングを防ぐ
  { key: "X-Content-Type-Options", value: "nosniff" },
  // リファラー情報の漏洩を最小化
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 不要なブラウザ機能へのアクセスを制限
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  // XSS攻撃を緩和するCSP（Google Maps対応）
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 開発モードでは React が eval() を使用するため unsafe-eval を許可
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.google.com",
      "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
      "frame-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
