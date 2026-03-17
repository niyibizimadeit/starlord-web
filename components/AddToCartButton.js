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

  // Compact mode — just Add to Cart, no Buy Now
  if (compact) {
    return (
      <button
        onClick={e => { e.preventDefault(); handleAddToCart(); }}
        style={{
          width: '100%',
          background: 'var(--gold)',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          padding: '8px',
          fontWeight: 700,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Add to Cart
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