import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip auth check for the admin login page itself (if you create one)
  // For now, we check all admin routes

  const adminAuth = request.cookies.get('admin_auth')?.value;

  // If not authenticated, redirect to login or return 401 for API calls
  if (adminAuth !== 'authenticated') {
    if (pathname.startsWith('/api/admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // For admin pages, we'll let the page handle the redirect
    // This allows the admin page.js to show its own login UI
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
