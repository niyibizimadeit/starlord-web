'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab]         = useState('phone'); // 'phone' | 'email'
  const [step, setStep]       = useState(1);       // phone: 1=enter phone, 2=enter OTP
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
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

  // ── Phone OTP handlers ────────────────────────────────────────────
  const handleRequestOTP = async () => {
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^(078|079|072|073)\d{7}$/.test(cleanPhone)) {
      setError('Enter a valid Rwandan phone number (078, 079, 072, or 073)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Could not send code. Try again.');
      else setStep(2);
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length < 4) { setError('Enter the full code from your SMS'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ''), token: otp }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Incorrect code. Try again.');
      else router.push('/account');
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
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

      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>
        Sign in
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 32,
        background: 'var(--surface)', borderRadius: 12,
        padding: 4, border: '1px solid var(--border)',
      }}>
        {[
          { key: 'phone', label: 'Phone OTP' },
          { key: 'email', label: 'Email' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(''); setStep(1); }}
            style={{
              flex: 1, padding: '10px 0',
              border: 'none', borderRadius: 9,
              background: tab === t.key ? 'var(--gold)' : 'transparent',
              color: tab === t.key ? '#000' : 'var(--text-muted)',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Phone OTP Tab ── */}
      {tab === 'phone' && step === 1 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel" placeholder="e.g. 0788 123 456"
              value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequestOTP()}
              style={inputStyle(phone)} autoFocus
            />
          </div>
          <ErrorBox msg={error} />
          <button onClick={handleRequestOTP} disabled={loading || !phone} style={{
            width: '100%', background: loading || !phone ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000', border: 'none', borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15, opacity: loading || !phone ? 0.7 : 1,
          }}>
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </>
      )}

      {tab === 'phone' && step === 2 && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Code sent to <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{phone}</span>
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, textAlign: 'center' }}>One-Time Code</label>
            <input
              type="number" placeholder="------"
              value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              style={{ ...inputStyle(otp), letterSpacing: 6, textAlign: 'center' }} autoFocus
            />
          </div>
          <ErrorBox msg={error} />
          <button onClick={handleVerifyOTP} disabled={loading || otp.length < 4} style={{
            width: '100%', background: loading || otp.length < 4 ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000', border: 'none', borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15, opacity: loading || otp.length < 4 ? 0.7 : 1,
          }}>
            {loading ? 'Verifying...' : 'Confirm Code'}
          </button>
          <button onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{
            width: '100%', background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 13, marginTop: 12, padding: '8px', cursor: 'pointer',
          }}>
            Wrong number? Go back
          </button>
        </>
      )}

      {/* ── Email Tab ── */}
      {tab === 'email' && (
        <>
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
        </>
      )}

      <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: 13 }}>
        No account?{' '}
        <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 700 }}>
          Create one
        </Link>
      </p>
    </div>
  );
}