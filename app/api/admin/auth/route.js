import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// ── Startup guard ─────────────────────────────────────────────────────────────
if (!process.env.ADMIN_SECRET) {
  throw new Error('ADMIN_SECRET environment variable is not set. Admin panel is disabled.');
}


const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET);
const JWT_EXPIRY = '24h';

async function createAdminToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

// ── POST /api/admin/auth — Login ──────────────────────────────────────────────
export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 });
    }

    // Constant-time comparison to prevent timing attacks
    const encoder = new TextEncoder();
    const a = encoder.encode(password);
    const b = encoder.encode(process.env.ADMIN_SECRET);

    // Simple length + content check (crypto.subtle not needed for this scale,
    // but we avoid early-exit string comparison)
    let mismatch = a.length !== b.length ? 1 : 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) mismatch |= a[i] ^ b[i];

    if (mismatch !== 0) {
      console.error(`[Admin] Failed login attempt at ${new Date().toISOString()}`);
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Issue signed JWT
    const token    = await createAdminToken();
    const cookieStore = await cookies();

    cookieStore.set('admin_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Admin] Auth error:', err);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// ── GET /api/admin/auth — Check session ───────────────────────────────────────
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    if (!token) return Response.json({ authenticated: false });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'admin') return Response.json({ authenticated: false });

    return Response.json({ authenticated: true });
  } catch {
    // jwtVerify throws on expired or tampered tokens
    return Response.json({ authenticated: false });
  }
}

// ── DELETE /api/admin/auth — Logout ───────────────────────────────────────────
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth');
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}