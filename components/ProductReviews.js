'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none', border: 'none',
            fontSize: readonly ? 16 : 28,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hovered || value) ? '#C9A84C' : 'var(--border)',
            padding: '0 2px',
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ProductReviews({ productId, deliveredOrders = [] }) {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [orderId, setOrderId]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    // Fetch reviews
    fetch(`/api/reviews?productId=${productId}`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews || []); setLoading(false); });

    // Check auth
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [productId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async () => {
    setError('');
    if (!rating) { setError('Please select a star rating'); return; }
    if (!comment.trim()) { setError('Please write a comment'); return; }
    if (!orderId) { setError('Please select which order this is for'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [data.review, ...prev]);
        setSuccess(true);
        setShowForm(false);
        setRating(0);
        setComment('');
        setOrderId('');
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch { setError('Connection error. Try again.'); }
    setSubmitting(false);
  };

  return (
    <div style={{ padding: '0 20px', marginTop: 32 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, background: 'var(--gold)', borderRadius: 2 }} />
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
            Reviews
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#C9A84C', fontSize: 16 }}>★</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{avgRating}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({reviews.length})</span>
            </div>
          )}
        </div>

        {isLoggedIn && deliveredOrders.length > 0 && !success && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? 'var(--surface)' : 'var(--gold)',
              color: showForm ? 'var(--text-muted)' : '#000',
              border: showForm ? '1px solid var(--border)' : 'none',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancel' : '+ Write Review'}
          </button>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div style={{
          background: '#1a2e1a', border: '1px solid #4caf7d',
          borderRadius: 10, padding: '12px 14px',
          color: '#4caf7d', fontSize: 13, marginBottom: 16,
        }}>
          ✓ Your review has been posted!
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--gold)',
          borderRadius: 14, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Star rating */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
              YOUR RATING
            </div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Order selector */}
          {deliveredOrders.length > 1 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                WHICH ORDER
              </div>
              <select
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                style={{
                  width: '100%', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '10px 12px', color: 'var(--text)', fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">Select order...</option>
                {deliveredOrders.map(o => (
                  <option key={o.id} value={o.id}>{o.reference}</option>
                ))}
              </select>
            </div>
          )}

          {/* Auto-select if only one order */}
          {deliveredOrders.length === 1 && !orderId && (
            <div style={{ display: 'none' }}>
              {(() => { if (!orderId) setOrderId(deliveredOrders[0].id); return null; })()}
            </div>
          )}

          {/* Comment */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
              YOUR REVIEW
            </div>
            <textarea
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              style={{
                width: '100%', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '12px 14px', color: 'var(--text)',
                fontSize: 13, resize: 'none', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              {comment.length}/1000
            </div>
          </div>

          {error && (
            <div style={{
              background: '#2e1a1a', border: '1px solid var(--red)',
              borderRadius: 10, padding: '10px 14px',
              color: 'var(--red)', fontSize: 13,
            }}>{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !rating || !comment.trim()}
            style={{
              background: submitting || !rating || !comment.trim() ? 'var(--surface-2)' : 'var(--gold)',
              color: submitting || !rating || !comment.trim() ? 'var(--text-muted)' : '#000',
              border: 'none', borderRadius: 10, padding: '14px',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {/* Not logged in prompt */}
      {!isLoggedIn && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          fontSize: 13, color: 'var(--text-muted)',
        }}>
          <a href="/login" style={{ color: 'var(--gold)', fontWeight: 700 }}>Log in</a>
          {' '}to leave a review after your order is delivered.
        </div>
      )}

      {/* Reviews list */}
      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
          Loading reviews...
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No reviews yet — be the first!
          </div>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(review => (
            <div key={review.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {review.users?.full_name || 'Customer'}
                  </div>
                  <StarRating value={review.rating} readonly />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {formatDate(review.created_at)}
                </div>
              </div>
              <p style={{
                fontSize: 13, color: 'var(--text-muted)',
                lineHeight: 1.6, margin: '8px 0 0',
              }}>
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}