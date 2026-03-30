'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function BannerSlider() {
  const [banners, setBanners]   = useState([]);
  const [active, setActive]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const touchStartX             = useRef(null);
  const intervalRef             = useRef(null);

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(d => {
        setBanners(d.banners || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActive(i => (i + 1) % banners.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [banners.length]);

  const goTo = (i) => {
    setActive(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % banners.length);
    }, 3000);
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0
        ? goTo((active + 1) % banners.length)
        : goTo((active - 1 + banners.length) % banners.length);
    }
    touchStartX.current = null;
  };

  if (loading || banners.length === 0) return null;

  const banner = banners[active];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(240px, 45vw, 520px)',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @media (max-width: 767px) {
          .banner-arrow { display: none !important; }
        }
      `}</style>

      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          style={{
            position: 'absolute', inset: 0,
            opacity: i === active ? 1 : 0,
            transition: 'opacity 0.7s ease',
            pointerEvents: i === active ? 'auto' : 'none',
          }}
        >
          {/* Background image */}
          {b.image_url ? (
            <img
              src={b.image_url}
              alt={b.title || ''}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
              }}
              loading={active === 0 ? 'eager' : 'lazy'}
              fetchPriority={active === 0 ? 'high' : 'auto'}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1a1208 0%, #0a0a0a 100%)',
            }} />
          )}

          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }} />

          {/* Content */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(20px, 5vw, 60px)',
            maxWidth: 600,
          }}>
            {b.subtitle && (
              <div style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                fontWeight: 700, color: 'var(--gold)',
                letterSpacing: 3, textTransform: 'uppercase',
                marginBottom: 10, fontFamily: 'monospace',
              }}>
                {b.subtitle}
              </div>
            )}
            {b.title && (
              <h2 style={{
                fontSize: 'clamp(22px, 4vw, 48px)',
                fontWeight: 800, color: '#fff',
                lineHeight: 1.15, margin: '0 0 20px',
                fontFamily: 'Playfair Display, serif',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>
                {b.title}
              </h2>
            )}
            {b.button_text && b.button_link && (
              <Link
                href={b.button_link}
                style={{
                  display: 'inline-block',
                  background: 'var(--gold)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 'clamp(12px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 1.5vw, 14px) clamp(20px, 3vw, 32px)',
                  borderRadius: 8,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  alignSelf: 'flex-start',
                  transition: 'opacity 0.2s',
                }}
              >
                {b.button_text}
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* Arrow buttons — desktop only */}
      {banners.length > 1 && (
        <>
          <button
            className="banner-arrow" 
            onClick={() => goTo((active - 1 + banners.length) % banners.length)}
            aria-label="Previous"
            style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}
          >‹</button>
          <button
            className="banner-arrow" 
            onClick={() => goTo((active + 1) % banners.length)}
            aria-label="Next"
            style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}
          >›</button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 16,
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, zIndex: 10,
        }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === active ? 24 : 8,
                height: 8, borderRadius: 4,
                background: i === active ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}