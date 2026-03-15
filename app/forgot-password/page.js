'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]           = useState(1); // 1=enter email, 2=enter OTP+new password
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');

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

  const handleSendCode = async () => {
    setError('');
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setMessage(`A 6-digit reset code was sent to ${email}`);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setError('');
    if (otp.length < 6) { setError('Enter the full 6-digit code'); return; }
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/account');
      } else {
        setError(data.error || 'Reset failed. Check your code and try again.');
      }
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
      maxWidth: 480, margin: '0 auto',
      padding: '60px 24px 100px',
      minHeight: '80vh', display: 'flex',
      flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>STARLORD</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 5 }}>GROUP</div>
      </div>

      {step === 1 ? (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Enter your email and we'll send you a 6-digit reset code.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
              style={inputStyle(email)} autoFocus
            />
          </div>

          <ErrorBox msg={error} />

          <button onClick={handleSendCode} disabled={loading || !email} style={{
            width: '100%',
            background: loading || !email ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000', border: 'none', borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15,
            opacity: loading || !email ? 0.7 : 1,
          }}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Enter New Password
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>6-Digit Code</label>
              <input
                type="number" placeholder="------"
                value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))}
                style={{ ...inputStyle(otp), letterSpacing: 8, textAlign: 'center', fontSize: 22, fontWeight: 800 }}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password" placeholder="At least 6 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={inputStyle(newPassword)}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password" placeholder="Repeat new password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                style={inputStyle(confirmPassword)}
              />
            </div>
          </div>

          <ErrorBox msg={error} />

          <button onClick={handleResetPassword} disabled={loading} style={{
            width: '100%',
            background: loading ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000', border: 'none', borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15,
          }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{
            width: '100%', background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 13, marginTop: 12, padding: '8px', cursor: 'pointer',
          }}>
            Go back
          </button>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <Link href="/login" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700 }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}