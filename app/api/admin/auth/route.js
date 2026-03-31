import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Admin login endpoint - server-side authentication
export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 });
    }

    // Check against admin secret (from environment variable, NOT exposed to client)
    if (password !== process.env.ADMIN_SECRET) {
      // Log failed attempt (without exposing the password)
      console.error('Failed admin login attempt');
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }

    const cookieStore = await cookies();

    // Create a session cookie that expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Set admin auth cookie (httpOnly, secure, sameSite)
    cookieStore.set('admin_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Admin auth error:', err);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Check admin auth status
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth')?.value;

    if (adminAuth === 'authenticated') {
      return Response.json({ authenticated: true });
    }

    return Response.json({ authenticated: false });
  } catch (err) {
    return Response.json({ authenticated: false });
  }
}

// Logout
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth');
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
