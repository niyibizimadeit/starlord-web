'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/account');
      else setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  const inputStyle = (hasValue) => ({
    width: '100%',
    background: 'var(--surface)',
    border: `1px solid ${hasValue ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 10,
    padding: '14px 16px',
    color: 'var(--text)',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block', fontSize: 12,
    color: 'var(--text-muted)', marginBottom: 8,
    fontWeight: 700, letterSpacing: 0.5,
  };

  // ── Email/Password handler ────────────────────────────────────────
  const handleEmailLogin = async () => {
    setError('');
    if (!email || !password) { setError('Enter your email and password'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Login failed. Check your credentials.');
      else router.push('/account');
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  const ErrorBox = ({ msg }) => msg ? (
    <div style={{
      background: '#2e1a1a', border: '1px solid var(--red)',
      borderRadius: 10, padding: '12px 14px',
      color: 'var(--red)', fontSize: 13, marginBottom: 16,
    }}>{msg}</div>
  ) : null;

  return (
    <div style={{
      maxWidth: 500, margin: '0 auto',
      padding: '60px 24px 100px',
      minHeight: '80vh', display: 'flex',
      flexDirection: 'column', justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>STARLORD</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 5 }}>GROUP</div>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 32 }}>
        Sign in
      </h1>

      {/* ── Email Login ── */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle(email)} autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                style={inputStyle(password)}
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link href="/forgot-password" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <ErrorBox msg={error} />

          <button onClick={handleEmailLogin} disabled={loading || !email || !password} style={{
            width: '100%', background: loading || !email || !password ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000', border: 'none', borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15, opacity: loading || !email || !password ? 0.7 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: 13 }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
  );
}