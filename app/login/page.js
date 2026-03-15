'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [checking, setChecking] = useState(true); // auth check in progress

  // ── Redirect already-logged-in users ──────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/account');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  // Show nothing while checking auth (prevents flash of login form)
  if (checking) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────

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
    letterSpacing: step === 2 ? 4 : 0,
    textAlign: step === 2 ? 'center' : 'left',
  });

  const handleRequestOTP = async () => {
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    if (!phoneRegex.test(cleanPhone)) {
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
      if (!res.ok) {
        setError(data.error || 'Could not send code. Try again.');
      } else {
        setStep(2);
      }
    } catch {
      setError('Connection error. Check your internet and try again.');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length < 4) {
      setError('Enter the full code from your SMS');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ''), token: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect code. Please try again.');
      } else {
        router.push('/account');
      }
    } catch {
      setError('Connection error. Check your internet and try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 500,
      margin: '0 auto',
      padding: '60px 24px 100px',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>
          STARLORD
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 5 }}>
          GROUP
        </div>
      </div>

      {step === 1 ? (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Sign in
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Enter your phone number. We will send you a one-time code to log in.
            No password needed.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12,
              color: 'var(--text-muted)', marginBottom: 8,
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 0788 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequestOTP()}
              style={inputStyle(phone)}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: '#2e1a1a', border: '1px solid var(--red)',
              borderRadius: 10, padding: '12px 14px',
              color: 'var(--red)', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleRequestOTP}
            disabled={loading || !phone}
            style={{
              width: '100%',
              background: loading || !phone ? 'var(--gold-dark)' : 'var(--gold)',
              color: '#000', border: 'none',
              borderRadius: 12, padding: '16px',
              fontWeight: 800, fontSize: 15,
              opacity: loading || !phone ? 0.7 : 1,
            }}
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>

          <p style={{
            textAlign: 'center', marginTop: 24,
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 700 }}>
              Create an account
            </Link>
            {' '}or{' '}
            <Link href="/" style={{ color: 'var(--gold)', fontWeight: 700 }}>
              just shop
            </Link>.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Enter your code
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            We sent a code to{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{phone}</span>.
            Enter it below.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12,
              color: 'var(--text-muted)', marginBottom: 8,
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              One-Time Code
            </label>
            <input
              type="number"
              placeholder="------"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              style={inputStyle(otp)}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: '#2e1a1a', border: '1px solid var(--red)',
              borderRadius: 10, padding: '12px 14px',
              color: 'var(--red)', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length < 4}
            style={{
              width: '100%',
              background: loading || otp.length < 4 ? 'var(--gold-dark)' : 'var(--gold)',
              color: '#000', border: 'none',
              borderRadius: 12, padding: '16px',
              fontWeight: 800, fontSize: 15,
              opacity: loading || otp.length < 4 ? 0.7 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Confirm Code'}
          </button>

          <button
            onClick={() => { setStep(1); setOtp(''); setError(''); }}
            style={{
              width: '100%', background: 'none',
              border: 'none', color: 'var(--text-muted)',
              fontSize: 13, marginTop: 16, padding: '8px',
            }}
          >
            Wrong number? Go back
          </button>
        </>
      )}
    </div>
  );
}