'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const STATUS_COLORS = {
  pending:        'var(--text-muted)',
  confirmed:      'var(--gold)',
  preparing:      'var(--gold)',
  dispatched:     '#6ab0f5',
  delivered:      'var(--green)',
  cancelled:      'var(--red)',
  stock_conflict: 'var(--red)',
};

function StatusBadge({ status }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: STATUS_COLORS[status] || 'var(--text-muted)',
      textTransform: 'capitalize',
      background: 'var(--surface-2)',
      padding: '3px 10px', borderRadius: 20,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Order Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{
            fontFamily: 'monospace', fontSize: 14,
            fontWeight: 800, color: 'var(--gold)', marginBottom: 4,
          }}>
            {order.reference}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {formatDate(order.created_at)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
            {formatRWF(order.total)}
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Order Items — expanded */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {order.order_items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  {item.products?.name || 'Product'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Qty {item.quantity}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>
                {formatRWF(item.price_at_time * item.quantity)}
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 6,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 10,
          }}>
            <Link
              href={`/track?ref=${order.reference}`}
              style={{
                flex: 1, display: 'block', textAlign: 'center',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px',
                fontSize: 13, fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountClient({ profile, orders }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 100px' }}>

      {/* Profile Header */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
            MY ACCOUNT
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {profile?.full_name || 'Welcome back'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {profile?.phone}
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>

      {/* Order History */}
      <div>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: 1, marginBottom: 14, fontWeight: 700,
        }}>
          ORDER HISTORY
        </div>

        {orders.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '40px 20px',
            textAlign: 'center',
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              No orders yet
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: 'var(--gold)',
                color: '#000',
                borderRadius: 10,
                padding: '10px 24px',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}