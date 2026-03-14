'use client';

import { useState, useRef } from 'react';

export default function ImageGallery({ images = [], productName = '' }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  const prev = () => setActive(i => (i - 1 + images.length) % images.length);
  const next = () => setActive(i => (i + 1) % images.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  if (!images.length) {
    return (
      <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#1a1a1a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#555', fontSize: 14 }}>No image</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#0a0a0a', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          src={images[active].url}
          alt={`${productName} — image ${active + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }}
          draggable={false}
        />

        {/* Counter badge */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
            {active + 1} / {images.length}
          </div>
        )}

        {/* Arrow buttons */}
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous image" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
            <button onClick={next} aria-label="Next image" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button key={img.id || i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
              style={{ flexShrink: 0, width: 64, height: 64, padding: 0, border: `2px solid ${i === active ? '#C9A84C' : 'transparent'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none', transition: 'border-color 0.2s' }}>
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}