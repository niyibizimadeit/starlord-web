'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme } = useTheme();

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: mounted ? 'pulse 3s ease-in-out infinite' : 'none',
      }} />

      {/* 404 number */}
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 'clamp(80px, 20vw, 160px)',
        fontWeight: 800,
        lineHeight: 1,
        color: 'var(--gold)',
        opacity: 0.15,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -60%)',
        userSelect: 'none',
        letterSpacing: -4,
        pointerEvents: 'none',
      }}>
        404
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <img
            src={theme === 'dark' ? '/logo/Light-no background.png' : '/logo/Dark-no background.png'}
            alt="STARLORD GROUP"
            style={{ height: 52, width: 'auto' }}
          />
        </div>

        {/* Gold accent line */}
        <div style={{
          width: 40, height: 2,
          background: 'var(--gold)',
          borderRadius: 1,
          margin: '0 auto 24px',
        }} />

        {/* Message */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(22px, 5vw, 32px)',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 12,
          lineHeight: 1.3,
        }}>
          This page doesn't exist
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth: 320,
          margin: '0 auto 40px',
        }}>
          The page you're looking for may have been moved, deleted,
          or never existed. Let's get you back to something good.
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
          maxWidth: 280,
          margin: '0 auto',
        }}>
          <Link href="/" style={{
            display: 'block', width: '100%',
            background: 'var(--gold)', color: '#000',
            borderRadius: 12, padding: '14px 28px',
            fontWeight: 800, fontSize: 14,
            textDecoration: 'none',
            letterSpacing: 0.5,
          }}>
            Back to Home
          </Link>

          <Link href="/products" style={{
            display: 'block', width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 12, padding: '14px 28px',
            fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
          }}>
            Browse Products
          </Link>

          <Link href="/track" style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginTop: 4,
          }}>
            Track an order →
          </Link>
        </div>

        {/* Decorative dots */}
        <div style={{
          display: 'flex', gap: 8,
          justifyContent: 'center',
          marginTop: 48,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === 1 ? 'var(--gold)' : 'var(--border)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}