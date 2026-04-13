'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered'];

const STATUS_LABELS = {
  pending:        'Order Received',
  confirmed:      'Confirmed',
  preparing:      'Preparing',
  dispatched:     'Out for Delivery',
  delivered:      'Delivered',
  cancelled:      'Cancelled',
  stock_conflict: 'Stock Issue',
};

const STATUS_COLORS = {
  pending:        'var(--gold)',
  confirmed:      'var(--gold)',
  preparing:      '#3498DB',
  dispatched:     '#9B59B6',
  delivered:      '#4caf7d',
  cancelled:      'var(--red)',
  stock_conflict: 'var(--red)',
};

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none',
            fontSize: 36, cursor: 'pointer',
            color: star <= (hovered || value) ? '#C9A84C' : 'var(--border)',
            padding: '0 2px', transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  );
}

// ── Tracking View (before delivery) ──────────────────────────────────────────
function TrackingView({ order }) {
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'stock_conflict';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 100px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-muted)', marginBottom: 8 }}>
          STARLORD GROUP
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          Track Your Order
        </h1>
        <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--gold)', letterSpacing: 2 }}>
          {order.reference}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        textAlign: 'center', marginBottom: 28,
        background: 'var(--surface)', border: `1px solid ${STATUS_COLORS[order.status]}`,
        borderRadius: 14, padding: '16px 20px',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Current Status</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[order.status] }}>
          {STATUS_LABELS[order.status] || order.status}
        </div>
      </div>

      {/* Progress steps */}
      {!isCancelled && (
        <div style={{ marginBottom: 28 }}>
          {STATUS_STEPS.map((step, i) => {
            const done    = i < currentStep;
            const active  = i === currentStep;
            const pending = i > currentStep;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                {/* Line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: done ? '#4caf7d' : active ? 'var(--gold)' : 'var(--surface)',
                    border: `2px solid ${done ? '#4caf7d' : active ? 'var(--gold)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done && <span style={{ color: '#000', fontSize: 10, fontWeight: 800 }}>✓</span>}
                    {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000', display: 'block' }} />}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 2, height: 24, background: done ? '#4caf7d' : 'var(--border)', marginTop: 2 }} />
                  )}
                </div>
                {/* Label */}
                <div style={{ paddingTop: 2, paddingBottom: i < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: active ? 800 : 600,
                    color: done ? '#4caf7d' : active ? 'var(--gold)' : 'var(--text-faint)',
                  }}>
                    {STATUS_LABELS[step]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1 }}>
          YOUR ITEMS
        </div>
        {order.order_items?.map(item => (
          <div key={item.product_id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
          }}>
            {item.products?.image_url && (
              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                <img src={item.products.image_url} alt={item.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.products?.name || 'Product'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
            </div>
          </div>
        ))}
        {order.delivery_address && (
          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
            📍 {order.delivery_address}
          </div>
        )}
        {order.delivery_slot && (
          <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            🕐 Preferred: {order.delivery_slot}
          </div>
        )}
      </div>

      {/* Come back message */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px',
        fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6,
      }}>
         Scan this QR code again after delivery to leave a review
      </div>
    </div>
  );
}

// ── Review View (after delivery) ──────────────────────────────────────────────
function ReviewView({ order, token }) {
  const [submitted, setSubmitted] = useState({});
  const [forms, setForms]         = useState(() => {
    const initial = {};
    order.order_items?.forEach(item => {
      initial[item.product_id] = { rating: 0, comment: '', error: '', submitting: false };
    });
    return initial;
  });

  const updateForm = (productId, key, value) => {
    setForms(prev => ({ ...prev, [productId]: { ...prev[productId], [key]: value } }));
  };

  const handleSubmit = async (productId) => {
    const form = forms[productId];
    if (!form.rating)        { updateForm(productId, 'error', 'Please select a rating'); return; }
    if (!form.comment.trim()) { updateForm(productId, 'error', 'Please write a comment'); return; }

    updateForm(productId, 'submitting', true);
    updateForm(productId, 'error', '');

    const res = await fetch(`/api/reviews/token?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating: form.rating, comment: form.comment }),
    });
    const data = await res.json();

    if (res.ok) {
      setSubmitted(prev => ({ ...prev, [productId]: true }));
    } else {
      updateForm(productId, 'error', data.error || 'Failed to submit');
    }
    updateForm(productId, 'submitting', false);
  };

  const items = order.order_items || [];
  const allSubmitted = items.length > 0 && items.every(item => submitted[item.product_id]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 100px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-muted)', marginBottom: 8 }}>
          STARLORD GROUP
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          How was your order?
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Hi {order.customer_name.split(' ')[0]}, share your experience with order{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace' }}>
            {order.reference}
          </span>
        </div>
      </div>

      {allSubmitted ? (
        <div style={{
          background: '#1a2e1a', border: '1px solid #4caf7d',
          borderRadius: 16, padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#4caf7d', marginBottom: 8 }}>
            Thank you for your reviews!
          </div>
          <div style={{ fontSize: 13, color: '#4caf7d', opacity: 0.8 }}>
            Your feedback helps other customers make better choices.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map(item => {
            const product = item.products;
            const form    = forms[item.product_id] || {};
            const done    = submitted[item.product_id];

            return (
              <div key={item.product_id} style={{
                background: 'var(--surface)', border: `1px solid ${done ? '#4caf7d' : 'var(--border)'}`,
                borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Product */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  {product?.image_url && (
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{product?.name || 'Product'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                  </div>
                </div>

                {done ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#4caf7d', fontWeight: 700, fontSize: 14 }}>
                    ✓ Review submitted — thank you!
                  </div>
                ) : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>YOUR RATING</div>
                      <StarPicker value={form.rating} onChange={v => updateForm(item.product_id, 'rating', v)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>YOUR REVIEW</div>
                      <textarea
                        placeholder="Share your experience with this product..."
                        value={form.comment}
                        onChange={e => updateForm(item.product_id, 'comment', e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', background: 'var(--bg)',
                          border: '1px solid var(--border)', borderRadius: 10,
                          padding: '12px 14px', color: 'var(--text)',
                          fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                    </div>
                    {form.error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{form.error}</div>}
                    <button
                      onClick={() => handleSubmit(item.product_id)}
                      disabled={form.submitting}
                      style={{
                        background: 'var(--gold)', color: '#000',
                        border: 'none', borderRadius: 10, padding: '13px',
                        fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        opacity: form.submitting ? 0.7 : 1,
                      }}
                    >
                      {form.submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function ReviewPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }
    fetch(`/api/reviews/token?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setOrder(d.order);
        setLoading(false);
      })
      .catch(() => { setError('Something went wrong'); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Invalid link</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error}</div>
    </div>
  );

  // Route to correct view based on status
  if (order.status === 'delivered') {
    return <ReviewView order={order} token={token} />;
  }
  return <TrackingView order={order} />;
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    }>
      <ReviewPageInner />
    </Suspense>
  );
}