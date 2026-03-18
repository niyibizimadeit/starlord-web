'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';

export default function VariationSelector({ product, variations }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState({});
  const [error, setError] = useState('');

  const hasVariations = variations && variations.length > 0;

  const handleSelect = (variationId, option) => {
    setSelected(prev => ({ ...prev, [variationId]: option }));
    setError('');
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

    // Build variations summary for order
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
      <div style={{
        width: '100%', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 12,
        padding: '16px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 15, fontWeight: 700,
      }}>
        Out of Stock
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Variation selectors */}
      {hasVariations && variations.map(variation => (
        <div key={variation.id}>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            {variation.name}
            {variation.is_required && (
              <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {variation.options.map(option => (
              <button
                key={option}
                onClick={() => handleSelect(variation.id, option)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `2px solid ${selected[variation.id] === option ? 'var(--gold)' : 'var(--border)'}`,
                  background: selected[variation.id] === option ? 'var(--surface-2)' : 'var(--surface)',
                  color: selected[variation.id] === option ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Error */}
      {error && (
        <div style={{
          background: '#2e1a1a', border: '1px solid var(--red)',
          borderRadius: 10, padding: '10px 14px',
          color: 'var(--red)', fontSize: 13,
        }}>{error}</div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => validateAndAdd(false)}
          style={{
            flex: 1, background: 'var(--surface-2)',
            color: 'var(--text)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          Add to Cart
        </button>
        <button
          onClick={() => validateAndAdd(true)}
          style={{
            flex: 1, background: 'var(--gold)',
            color: '#000', border: 'none',
            borderRadius: 12, padding: '16px',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}