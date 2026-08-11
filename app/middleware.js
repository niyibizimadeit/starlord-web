import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis or Vercel KV)
// Note: This operates per-instance only. On serverless platforms (Vercel),
// each cold start begins with a fresh map. The primary defense against
// abuse is the idempotency key in orders and the 100-request/min webhook
// allowance — both of which survive cold starts.
const rateLimitMap = new Map();

const RATE_LIMIT_CONFIG = {
  '/api/auth':     { windowMs: 60000, maxRequests: 5 },
  '/api/checkout': { windowMs: 60000, maxRequests: 10 },
  '/api/webhooks': { windowMs: 60000, maxRequests: 100 },
  '/api/admin':    { windowMs: 60000, maxRequests: 30 },
  default:         { windowMs: 60000, maxRequests: 60 },
};

function getRateLimitConfig(pathname) {
  for (const [prefix, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return RATE_LIMIT_CONFIG.default;
}

function checkRateLimit(identifier, config) {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;
  const record = rateLimitMap.get(key);

  // Purge any expired entry before checking
  if (record && now > record.resetAt) {
    rateLimitMap.delete(key);
  }

  const current = rateLimitMap.get(key);
  if (!current) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (current.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count++;
  return { allowed: true, remaining: config.maxRequests - current.count };
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static files
  if (pathname.startsWith('/_next/static') ||
      pathname.startsWith('/_next/image') ||
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  // Rate limiting for API routes
  if (pathname.startsWith('/api')) {
    // In production, use request.ip set by Vercel's edge — cannot be spoofed.
    // x-forwarded-for is client-controlled and must NOT be trusted in production.
    let identifier;
    if (process.env.NODE_ENV === 'production') {
      identifier = request.ip ?? null;
      if (!identifier) {
        // Can't identify caller — block to be safe
        return new NextResponse(
          JSON.stringify({ error: 'Unable to verify request origin' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Local dev: Next.js dev server doesn't populate request.ip
      identifier = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
                ?? request.headers.get('x-real-ip')
                ?? '127.0.0.1';
    }

    const config = getRateLimitConfig(pathname);
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      const resetSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(resetSeconds),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove Server header
  response.headers.delete('Server');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
