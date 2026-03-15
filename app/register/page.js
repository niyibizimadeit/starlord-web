'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle verification success redirect
  if (typeof window !== 'undefined') {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      setShowSuccess(true);
      setMessage('Email verified! You can now log in.');
    }
  }

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const inputStyle = (hasValue, errorState = false) => ({
    width: '100%',
    background: 'var(--surface)',
    border: `1px solid ${errorState ? 'var(--red)' : hasValue ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 10,
    padding: '14px 16px',
    color: 'var(--text)',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('All fields required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be 6+ characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Check your email for verification link (valid 30 min)');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    }

    setLoading(false);
  };

  if (showSuccess) {
    return (
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '60px 24px 100px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 24 }}>✅ Welcome!</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
          Email Verified
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
          Your account is ready. Log in with your email & password.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: '#000',
            padding: '16px 32px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: '60px 24px 100px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', letterSpacing: 2 }}>
          STARLORD
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 4 }}>
          GROUP
        </div>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Create Account
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Sign up and get email verification. We'll help you verify your account.
      </p>

      {message && (
        <div style={{
          background: '#1a2e1a',
          border: '1px solid #4caf7d',
          borderRadius: 10,
          padding: '12px 14px',
          color: '#4caf7d',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#2e1a1a',
          border: '1px solid var(--red)',
          borderRadius: 10,
          padding: '12px 14px',
          color: 'var(--red)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginBottom: 8, 
            fontWeight: 700 
          }}>
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => updateForm('full_name', e.target.value)}
            placeholder="John Doe"
            style={inputStyle(formData.full_name)}
            autoFocus
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginBottom: 8, 
            fontWeight: 700 
          }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="you@example.com"
            style={inputStyle(formData.email)}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginBottom: 8, 
            fontWeight: 700 
          }}>
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => updateForm('password', e.target.value)}
            placeholder="At least 6 characters"
            style={inputStyle(formData.password)}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginBottom: 8, 
            fontWeight: 700 
          }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateForm('confirmPassword', e.target.value)}
            placeholder="Repeat password"
            style={inputStyle(formData.confirmPassword)}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'var(--gold-dark)' : 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link
          href="/login"
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}

