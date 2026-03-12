'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

export default function CartHeader() {
  const { cartCount, cartTotal } = useCart();

  const formatRWF = (n) => `RWF ${Number(n).toLocaleString()}`;

  return (
    <Link
      href="/cart"
      style={{
        background: cartCount > 0 ? 'var(--gold)' : 'var(--surface)',
        border: `1px solid ${cartCount > 0 ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 700,
        color: cartCount > 0 ? '#000' : 'var(--text)',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {cartCount > 0 ? `Cart (${cartCount}) · ${formatRWF(cartTotal)}` : 'Cart'}
    </Link>
  );
}