// app/admin/middleware.js
import { NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // For API routes: accept either the cookie OR the x-admin-secret header
  if (pathname.startsWith('/api/admin')) {
    const adminAuth = request.cookies.get('admin_auth')?.value;
    const secretHeader = request.headers.get('x-admin-secret');

    if (adminAuth !== 'authenticated' && secretHeader !== ADMIN_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // For admin pages: cookie only
  const adminAuth = request.cookies.get('admin_auth')?.value;
  if (adminAuth !== 'authenticated') {
    // Let the page handle its own login UI
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};