'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Image placeholder */}
      <div className="skeleton-shimmer" style={{
        width: '100%', aspectRatio: '1 / 1',
        background: 'var(--surface-2)',
      }} />
      {/* Text lines */}
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton-shimmer" style={{
          height: 14, width: '70%', borderRadius: 6,
          background: 'var(--surface-2)',
        }} />
        <div className="skeleton-shimmer" style={{
          height: 14, width: '45%', borderRadius: 6,
          background: 'var(--surface-2)',
        }} />
        <div className="skeleton-shimmer" style={{
          height: 34, width: '100%', borderRadius: 8, marginTop: 6,
          background: 'var(--surface-2)',
        }} />
      </div>
    </div>
  );
}

export default function LoadingScreen() {
  const { theme } = useTheme();
  const [stage, setStage] = useState('logo'); // 'logo' | 'skeleton'
  const [fadeLogo, setFadeLogo] = useState(false);

  useEffect(() => {
    // Hold logo for 1.8s, then transition to skeleton
    const t1 = setTimeout(() => setFadeLogo(true), 1600);
    const t2 = setTimeout(() => setStage('skeleton'), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const logoSrc = theme === 'dark'
    ? '/logo/Light-no background.png'
    : '/logo/Dark-no background.png';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      transition: 'background 0.3s ease',
    }}>
      {/* ── Stage 1: Big centered logo ──────────────────────── */}
      {stage === 'logo' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          opacity: fadeLogo ? 0 : 1,
          transform: fadeLogo ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          {/* Glow ring */}
          <div style={{
            position: 'absolute',
            width: 200, height: 200,
            borderRadius: '50%',
            background: 'var(--gold-glow)',
            filter: 'blur(40px)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }} />
          <img
            src={logoSrc}
            alt="STARLORD GROUP"
            style={{
              height: 140,
              width: 'auto',
              position: 'relative',
              zIndex: 1,
              animation: 'logo-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          />
          {/* Dot indicator */}
          <div style={{
            display: 'flex', gap: 8, position: 'relative', zIndex: 1,
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--gold)',
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Stage 2: Skeleton grid ──────────────────────────── */}
      {stage === 'skeleton' && (
        <div style={{
          width: '100%', maxWidth: 1280,
          padding: '40px 24px',
          opacity: fadeLogo ? 0 : 1,
          animation: 'fade-in 0.5s ease 0.1s both',
        }}>
          {/* Skeleton header */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div className="skeleton-shimmer" style={{
              height: 28, width: 200, borderRadius: 8,
              background: 'var(--surface-2)', margin: '0 auto 12px',
            }} />
            <div className="skeleton-shimmer" style={{
              height: 14, width: 140, borderRadius: 6,
              background: 'var(--surface-2)', margin: '0 auto',
            }} />
          </div>
          {/* Skeleton product grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
          }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* ── Animations ──────────────────────────────────────── */}
      <style>{`
        @keyframes logo-enter {
          0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.3); opacity: 1;   }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-8px); }
        }
        @keyframes fade-in {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--surface-2) 0%,
            var(--surface-3) 40%,
            var(--surface-2) 80%
          );
          background-size: 400px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
