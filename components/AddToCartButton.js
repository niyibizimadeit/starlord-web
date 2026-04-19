'use client';

import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';

export default function AddToCartButton({ product, compact = false }) {
  const { addToCart } = useCart();
  const router = useRouter();

  if (product.stock === 0) {
    return (
      <div style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: compact ? '8px' : '16px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: compact ? 12 : 15,
        fontWeight: 700,
      }}>
        Out of Stock
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    router.push('/cart');
  };

  const handleBuyNow = () => {
    addToCart(product);
    router.push('/checkout');
  };

  // Compact mode — glass circle icon (matches ProductGrid cart button)
  if (compact) {
    return (
      <button
        onClick={e => { e.preventDefault(); handleAddToCart(); }}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 10px rgba(0,0,0,0.08)',
          color: 'var(--text-muted)',
          transition: 'background 0.22s, box-shadow 0.22s, color 0.22s, transform 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--gold)';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = '#000';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(184,134,11,0.38), inset 0 1px 0 rgba(255,255,255,0.35)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 10px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Add to cart"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.84L22.34 2H1Z"/>
        </svg>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={handleAddToCart}
        style={{
          flex: 1,
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px',
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Add to Cart
      </button>
      <button
        onClick={handleBuyNow}
        style={{
          flex: 1,
          background: 'var(--gold)',
          color: '#000',
          border: 'none',
          borderRadius: 12,
          padding: '16px',
          fontWeight: 800,
          fontSize: 15,
        }}
      >
        Buy Now
      </button>
    </div>
  );
}