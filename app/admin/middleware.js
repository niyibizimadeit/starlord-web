import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET
);

async function isValidAdminToken(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    // Catches: expired, bad signature, malformed
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_auth')?.value;

  // ── API routes ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    // Allow the auth endpoint itself through (login/logout don't need a valid token)
    if (pathname === '/api/admin/auth') return NextResponse.next();

    if (!(await isValidAdminToken(token))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Admin UI pages ──────────────────────────────────────────────────────────
  // Let the page render — admin/page.js handles its own login UI.
  // The API routes above are what truly gate access to data.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};