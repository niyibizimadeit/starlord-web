'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

const STATUS_LABELS = {
  pending: 'Payment Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  dispatched: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  stock_conflict: 'Stock Issue',
};

const STATUS_COLORS = {
  pending: 'var(--gold)',
  confirmed: 'var(--green)',
  preparing: '#3498DB',
  dispatched: '#9B59B6',
  delivered: 'var(--green)',
  cancelled: 'var(--red)',
  stock_conflict: 'var(--red)',
};

function TrackPageInner() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (initialRef && initialPhone) {
      handleTrack(initialRef, initialPhone);
    }
  }, []);

  const handleTrack = async (orderRef = ref, orderPhone = phone) => {
    if (!orderRef.trim() || !orderPhone.trim()) {
      setError('Please enter both order reference and phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track?ref=${encodeURIComponent(orderRef)}&phone=${encodeURIComponent(orderPhone)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to track order');
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    const message = `Hi, I need help with order ${order?.reference}`;
    return `https://wa.me/250788678590?text=${encodeURIComponent(message)}`;
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 120px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>
        Track Order
      </h1>

      {/* Search Form */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
            Order Reference
          </label>
          <input
            type="text"
            placeholder="e.g. SL-K4X9PQ"
            value={ref}
            onChange={e => setRef(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 16px',
              color: 'var(--text)',
              fontSize: 15,
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 0788 123 456"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 16px',
              color: 'var(--text)',
              fontSize: 15,
            }}
          />
        </div>

        <button
          onClick={() => handleTrack()}
          disabled={loading || !ref.trim() || !phone.trim()}
          style={{
            width: '100%',
            background: loading ? 'var(--text-faint)' : 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontWeight: 800,
            fontSize: 15,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Tracking...' : 'Track Order'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#2e1a1a',
          border: '1px solid var(--red)',
          borderRadius: 12,
          padding: '16px',
          color: 'var(--red)',
          fontSize: 14,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {order && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            background: STATUS_COLORS[order.status],
            padding: '20px 24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
              {STATUS_LABELS[order.status] || order.status}
            </div>
            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>
              {order.reference}
            </div>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{order.customerName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.customerPhone}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Delivery Address</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{order.deliveryAddress}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Items</div>
              {order.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: '8px 0',
                }}>
                  <div style={{
                    width: 48, height: 48,
                    background: 'var(--surface-2)',
                    borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                  }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                    {formatRWF(item.priceAtTime * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{formatRWF(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Delivery</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{formatRWF(order.deliveryFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>{formatRWF(order.total)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: 16, textAlign: 'center' }}>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#25D366', color: '#fff',
                padding: '12px 24px', borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    }>
      <TrackPageInner />
    </Suspense>
  );
}