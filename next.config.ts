import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // The local machine's VPN resolves images.starlordgroup.rw to a private
    // fake-IP, which the optimizer blocks. Vercel resolves it publicly, so
    // keep the SSRF guard enabled there (VERCEL=1) and relax it locally.
    dangerouslyAllowLocalIP: !process.env.VERCEL,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.starlordgroup.rw',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Exclude IremboPay proxy routes — the widget loads its popup
        // in an iframe which needs X-Frame-Options and frame-ancestors
        // relaxed, and the proxy injects its own CSP.
        source: '/((?!api/irembopay).*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://dashboard.irembopay.com https://ap-gateway.mastercard.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://dashboard.irembopay.com https://ap-gateway.mastercard.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com https://dashboard.irembopay.com https://ap-gateway.mastercard.com; img-src 'self' https://images.starlordgroup.rw https://res.cloudinary.com data: https://dashboard.irembopay.com https://ap-gateway.mastercard.com; connect-src 'self' https://zphpfahgyerabtpvtwol.supabase.co https://api-js.mixpanel.com https://api.irembopay.com https://dashboard.irembopay.com https://ap-gateway.mastercard.com; frame-src https:; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://ap-gateway.mastercard.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://ap-gateway.mastercard.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://ap-gateway.mastercard.com; img-src 'self' https://images.starlordgroup.rw https://res.cloudinary.com data: https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://ap-gateway.mastercard.com; connect-src 'self' https://zphpfahgyerabtpvtwol.supabase.co https://*.vercel.live https://api-js.mixpanel.com https://api.irembopay.com https://dashboard.irembopay.com https://api.sandbox.irembopay.com https://dashboard.sandbox.irembopay.com https://ap-gateway.mastercard.com; frame-src https:; frame-ancestors 'none';",
          },
        ],
      },
      // IremboPay proxy routes — omit framing restrictions so the
      // widget's popup can load inside its iframe.
      {
        source: '/api/irembopay-dashboard/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;