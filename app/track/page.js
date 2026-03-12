'use client';

import { useState, useEffect } from 'react';
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

export default function TrackPage() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  // Pre-fill from URL params
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
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    const message = `Hi, I need help with order ${order?.reference}`;
    return `https://wa.me/250788123456?text=${encodeURIComponent(message)}`;
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

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'var(--red-bg)',
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

      {/* Order Details */}
      {order && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Status Header */}
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

          {/* Order Info */}
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

            {/* Items */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Items</div>
              {order.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                }}>
                  <div style={{
                    width: 48, height: 48,
                    background: 'var(--surface-2)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
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

            {/* Totals */}
            <div style={{
              borderTop: '1px solid var(--border)',
              marginTop: 16,
              paddingTop: 16,
            }}>
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

          {/* Support */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: 16,
            textAlign: 'center',
          }}>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#25D366',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact Support
            </a>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

