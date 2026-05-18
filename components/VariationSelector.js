'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';

export default function VariationSelector({ product, variations, onOptionSelect }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState({});
  const [error, setError] = useState('');

  const hasVariations = variations && variations.length > 0;

  const handleSelect = (variationId, option) => {
    setSelected(prev => ({ ...prev, [variationId]: option }));
    setError('');
    // Notify parent about the selected option + its image map
    if (onOptionSelect) {
      const variation = variations.find(v => v.id === variationId);
      onOptionSelect(variationId, option, variation?.option_images);
    }
  };

  const validateAndAdd = (goToCheckout = false) => {
    setError('');
    if (hasVariations) {
      const missing = variations.filter(v => v.is_required && !selected[v.id]);
      if (missing.length > 0) {
        setError(`Please select: ${missing.map(v => v.name).join(', ')}`);
        return;
      }
    }
    const variationsSummary = hasVariations
      ? Object.entries(selected).map(([id, option]) => {
          const variation = variations.find(v => v.id === id);
          return { name: variation?.name, option };
        })
      : [];
    addToCart({ ...product, selectedVariations: variationsSummary });
    if (goToCheckout) router.push('/checkout');
    else router.push('/cart');
  };

  if (product.stock === 0) {
    return (
      <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, fontWeight: 700 }}>
        Out of Stock
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hasVariations && variations.map(variation => (
        <div key={variation.id}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            {variation.name}
            {variation.is_required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {variation.options.map(option => {
              const hasImage = !!variation.option_images?.[option];
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(variation.id, option)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: `2px solid ${selected[variation.id] === option ? 'var(--gold)' : 'var(--border)'}`,
                    background: selected[variation.id] === option ? 'var(--surface-2)' : 'var(--surface)',
                    color: selected[variation.id] === option ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {option}
                  {/* Small dot indicates this option has a preview image */}
                  {hasImage && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: selected[variation.id] === option ? 'var(--gold)' : '#555', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <div style={{ background: '#2e1a1a', border: '1px solid var(--red)', borderRadius: 10, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => validateAndAdd(false)}
          style={{ flex: 1, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.12)', transition: 'box-shadow 0.2s, transform 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Add to Cart
        </button>
        <button
          onClick={() => validateAndAdd(true)}
          style={{ flex: 1, background: 'linear-gradient(148deg, rgba(184,134,11,0.97) 0%, rgba(139,101,8,0.97) 100%)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', color: '#000', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 14, padding: '16px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.42), 0 4px 16px rgba(184,134,11,0.32)', transition: 'box-shadow 0.2s, transform 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}