'use client';

import { useCart } from '@/components/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

const DELIVERY_FEE = 2000;

export default function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
          Your cart is empty
        </div>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 24,
            background: 'var(--gold)',
            color: '#000',
            borderRadius: 12,
            padding: '14px 28px',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 120 }}>

      <div style={{ padding: '24px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          Your Cart
        </h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {cart.reduce((s, i) => s + i.qty, 0)} items
        </div>
      </div>

      {/* Cart Items */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cart.map(item => (
          <div
            key={item.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 14,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            {/* Image */}
            <div style={{
              width: 64, height: 64,
              background: '#1a1a2e',
              borderRadius: 10,
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>IMG</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.name}
              </div>
              <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                {formatRWF(item.price)}
              </div>

              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => updateQty(item.id, -1)}
                  style={{
                    background: 'var(--border)',
                    border: 'none',
                    color: 'var(--text)',
                    width: 28, height: 28,
                    borderRadius: 7,
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  -
                </button>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  style={{
                    background: 'var(--border)',
                    border: 'none',
                    color: 'var(--text)',
                    width: 28, height: 28,
                    borderRadius: 7,
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                fontSize: 18,
                padding: 4,
                flexShrink: 0,
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div style={{
        margin: '20px 20px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 16,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
          Order Summary
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Subtotal</span>
          <span style={{ color: 'var(--text)', fontSize: 13 }}>{formatRWF(cartTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Delivery</span>
          <span style={{ color: 'var(--text)', fontSize: 13 }}>{formatRWF(DELIVERY_FEE)}</span>
        </div>
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--gold)' }}>
            {formatRWF(cartTotal + DELIVERY_FEE)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={() => router.push('/checkout')}
          style={{
            width: '100%',
            background: 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: 14,
            padding: '16px',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Checkout — {formatRWF(cartTotal + DELIVERY_FEE)}
        </button>
        <Link
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 14,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}