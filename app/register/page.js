'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: '#2e1a1a', border: '1px solid var(--red)',
      borderRadius: 10, padding: '12px 14px',
      color: 'var(--red)', fontSize: 13, marginBottom: 16,
    }}>{msg}</div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]     = useState(1); // 1=form, 2=verify OTP
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
  });
  const [otpCode, setOtpCode]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [accountExists, setAccountExists] = useState(false);

  // Redirect logged-in users
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
    borderRadius: 10, padding: '14px 16px',
    color: 'var(--text)', fontSize: 16,
    outline: 'none', boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block', fontSize: 12,
    color: 'var(--text-muted)', marginBottom: 8,
    fontWeight: 700, letterSpacing: 0.5,
  };

  const handleRegister = async () => {
    setError('');
    setAccountExists(false);
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('All fields are required'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
  
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === 'account_exists') {
        setAccountExists(true);
      } else if (res.ok) {
        setStep(2);
        setMessage(`A 6-digit code was sent to ${formData.email}`);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  const handleVerifyEmail = async () => {
    setError('');
    if (otpCode.length < 6) { setError('Enter the full 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, token: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/account');
      } else {
        setError(data.error || 'Invalid or expired code. Try again.');
      }
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  
  // ── Step 2: Email OTP verification ────────────────────────────────
  if (step === 2) {
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '60px 24px 100px',
        minHeight: '80vh', display: 'flex',
        flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>STARLORD</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 5 }}>GROUP</div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Verify your email
        </h1>

        {message && (
          <div style={{
            background: '#1a2e1a', border: '1px solid #4caf7d',
            borderRadius: 10, padding: '12px 14px',
            color: '#4caf7d', fontSize: 13, marginBottom: 24,
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, textAlign: 'center' }}>6-Digit Verification Code</label>
          <input
            type="number" placeholder="------"
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleVerifyEmail()}
            style={{
              ...inputStyle(otpCode),
              letterSpacing: 8, textAlign: 'center', fontSize: 24, fontWeight: 800,
            }}
            autoFocus
          />
        </div>

        <ErrorBox msg={error} />

        <button onClick={handleVerifyEmail} disabled={loading || otpCode.length < 6} style={{
          width: '100%',
          background: loading || otpCode.length < 6 ? 'var(--gold-dark)' : 'var(--gold)',
          color: '#000', border: 'none', borderRadius: 12, padding: '16px',
          fontWeight: 800, fontSize: 15,
          opacity: loading || otpCode.length < 6 ? 0.7 : 1,
        }}>
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <button onClick={() => { setStep(1); setOtpCode(''); setError(''); }} style={{
          width: '100%', background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 13, marginTop: 12, padding: '8px', cursor: 'pointer',
        }}>
          Go back
        </button>
      </div>
    );
  }

  // ── Step 1: Registration form ─────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px 100px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>STARLORD</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 5 }}>GROUP</div>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        Create Account
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
        We will send a 6-digit code to your email to verify your account.
      </p>

      <ErrorBox msg={error} />

      {accountExists && (
        <div style={{
          background: '#1a1f2e', border: '1px solid var(--gold)',
          borderRadius: 10, padding: '16px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
            An account with this email already exists
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Would you like to sign in or reset your password?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/login?email=${encodeURIComponent(formData.email)}`} style={{
              flex: 1, textAlign: 'center',
              background: 'var(--gold)', color: '#000',
              borderRadius: 8, padding: '10px',
              fontWeight: 800, fontSize: 13, textDecoration: 'none',
            }}>
              Sign In
            </Link>
            <Link href={`/forgot-password?email=${encodeURIComponent(formData.email)}`} style={{
              flex: 1, textAlign: 'center',
              background: 'var(--surface)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px',
              fontWeight: 700, fontSize: 13, textDecoration: 'none',
            }}>
              Reset Password
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text" placeholder="Ntwali Franklin"
            value={formData.full_name}
            onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
            style={inputStyle(formData.full_name)} autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email" placeholder="you@example.com"
            value={formData.email}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            style={inputStyle(formData.email)}
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password" placeholder="At least 6 characters"
            value={formData.password}
            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
            style={inputStyle(formData.password)}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password" placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={inputStyle(formData.confirmPassword)}
          />
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: '100%',
          background: loading ? 'var(--gold-dark)' : 'var(--gold)',
          color: '#000', border: 'none', borderRadius: 12, padding: '16px',
          fontWeight: 800, fontSize: 15,
        }}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Already have an account?{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Sign in</span>
        </Link>
      </div>
    </div>
  );
}