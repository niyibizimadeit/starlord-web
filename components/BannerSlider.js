'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const BANNERS = [
  {
    id: 1,
    label: 'New Season',
    heading: 'Protect Your Device\nin Style',
    sub: 'Premium cases for every phone. Engineered to last.',
    cta: 'Shop Tech',
    href: '/?category=Tech',
    accent: '#C9A84C',
    bg: 'linear-gradient(135deg, #1A1200 0%, #0A0A0A 60%, #1A1A2E 100%)',
    bgLight: 'linear-gradient(135deg, #F5EDD8 0%, #FAF6F0 60%, #E8E0F0 100%)',
  },
  {
    id: 2,
    label: 'Fashion Edit',
    heading: 'Accessories That\nDefine You',
    sub: 'Belts, sunglasses, and statement pieces for every look.',
    cta: 'Shop Fashion',
    href: '/?category=Fashion',
    accent: '#C9A84C',
    bg: 'linear-gradient(135deg, #1A0A00 0%, #0A0A0A 60%, #2E1A0A 100%)',
    bgLight: 'linear-gradient(135deg, #F5EAD8 0%, #FAF6F0 60%, #F0E8D8 100%)',
  },
  {
    id: 3,
    label: 'Limited Offer',
    heading: 'Up to 35% Off\nSelected Items',
    sub: 'Sale ends soon. Pay with MTN MoMo or Airtel Money.',
    cta: 'View Sale',
    href: '/?badge=SALE',
    accent: '#C0392B',
    bg: 'linear-gradient(135deg, #1A0000 0%, #0A0A0A 60%, #2E0A0A 100%)',
    bgLight: 'linear-gradient(135deg, #F5E0D8 0%, #FAF6F0 60%, #F0D8D8 100%)',
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [isDark,  setIsDark]  = useState(true);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme !== 'light');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % BANNERS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  // Touch swipe
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(touchStartY.current - touchEndY.current);
    
    if (deltaY > 30) return; // Ignore vertical scroll
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartX.current = 0;
    touchStartY.current = 0;
  }, [next, prev]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const banner = BANNERS[current];

  return (
    <div
      className="banner-slider"
      style={{ position: 'relative', overflow: 'hidden', userSelect: 'none', touchAction: 'pan-y' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide */}
      <div
        className="banner-slide"
        key={banner.id}
        style={{
          background: isDark ? banner.bg : banner.bgLight,
          minHeight: 540,
          display: 'flex',
          alignItems: 'center',
          padding: '60px 24px',
          transition: 'background 0.6s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', right: -80, top: '50%',
          transform: 'translateY(-50%)',
          width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${banner.accent}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 60, top: '50%',
          transform: 'translateY(-50%)',
          width: 180, height: 180,
          borderRadius: '50%',
          border: `1px solid ${banner.accent}30`,
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <div style={{
            display: 'inline-block',
            fontSize: 10, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase',
            color: banner.accent,
            border: `1px solid ${banner.accent}50`,
            borderRadius: 4,
            padding: '4px 12px',
            marginBottom: 20,
            fontFamily: 'Lato, sans-serif',
          }}>
            {banner.label}
          </div>

          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 800,
            color: 'var(--text)',
            lineHeight: 1.15,
            marginBottom: 16,
            whiteSpace: 'pre-line',
            maxWidth: 560,
          }}>
            {banner.heading}
          </h2>

          <p style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginBottom: 32,
            maxWidth: 400,
            lineHeight: 1.7,
          }}>
            {banner.sub}
          </p>

          <Link href={banner.href} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: banner.accent,
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {banner.cta}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 8,
      }}>
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? banner.accent : 'var(--border)',
              border: 'none',
              padding: 0,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {['prev', 'next'].map(dir => (
        <button
          key={dir}
          onClick={() => setCurrent(c =>
            dir === 'prev'
              ? (c - 1 + BANNERS.length) % BANNERS.length
              : (c + 1) % BANNERS.length
          )}
          style={{
            position: 'absolute',
            top: '50%', transform: 'translateY(-50%)',
            [dir === 'prev' ? 'left' : 'right']: 16,
            width: 40, height: 40,
            borderRadius: '50%',
            background: 'var(--overlay)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            transition: 'background 0.2s',
            backdropFilter: 'blur(4px)',
          }}
          aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
        >
          {dir === 'prev' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}