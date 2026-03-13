'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ADMIN_SECRET = 'starlord2024admin';

function formatRWF(n) { return `RWF ${Number(n).toLocaleString()}`; }
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_COLORS = {
  pending:        '#C9A84C',
  confirmed:      '#4caf7d',
  preparing:      '#3498DB',
  dispatched:     '#9B59B6',
  delivered:      '#4caf7d',
  cancelled:      '#e05555',
  stock_conflict: '#e05555',
};

const NEXT_STATUS = {
  pending:    'confirmed',
  confirmed:  'preparing',
  preparing:  'dispatched',
  dispatched: 'delivered',
};

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab]         = useState('orders');
  const [orders, setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState('all');

  const api = useCallback(async (type, method = 'GET', body = null) => {
    const url = `/api/admin/dashboard?secret=${ADMIN_SECRET}&type=${type}`;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify({ ...body, secret: ADMIN_SECRET });
    const res = await fetch(method === 'PATCH' ? `/api/admin/dashboard?secret=${ADMIN_SECRET}` : url, opts);
    return res.json();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (tab === 'orders') {
      const { data } = await api('orders');
      setOrders(data || []);
    } else if (tab === 'products') {
      const { data } = await api('products');
      setProducts(data || []);
    } else if (tab === 'analytics') {
      const { data } = await api('analytics');
      setAnalytics(data);
    }
    setLoading(false);
  }, [tab, api]);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const handleLogin = () => {
    if (password === ADMIN_SECRET) setAuthed(true);
    else alert('Wrong password');
  };

  const updateOrderStatus = async (id, status) => {
    await api('order_status', 'PATCH', { type: 'order_status', id, status });
    loadData();
  };

  const updateProduct = async (id, price, stock, is_active) => {
    await api('product', 'PATCH', { type: 'product', id, price: parseInt(price), stock: parseInt(stock), is_active });
    loadData();
  };

  const s = {
    page:       { maxWidth: 1100, margin: '0 auto', padding: '24px 20px', fontFamily: 'Georgia, serif' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #2a2a2a' },
    logo:       { fontSize: 20, fontWeight: 800, color: '#C9A84C', letterSpacing: 3 },
    tabs:       { display: 'flex', gap: 8, marginBottom: 24 },
    tab:        { padding: '8px 20px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#141414', color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    tabActive:  { background: '#C9A84C', color: '#000', borderColor: '#C9A84C' },
    card:       { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
    cardHead:   { padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge:      { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4 },
    input:      { background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, width: '100%' },
    btn:        { padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
    statCard:   { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: '20px' },
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 340, padding: 32, background: '#141414', borderRadius: 16, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#C9A84C', letterSpacing: 3, textAlign: 'center', marginBottom: 4 }}>STARLORD</div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 5, textAlign: 'center', marginBottom: 32 }}>ADMIN PANEL</div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...s.input, marginBottom: 12 }}
            autoFocus
          />
          <button onClick={handleLogin} style={{ ...s.btn, width: '100%', background: '#C9A84C', color: '#000', padding: '12px' }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0ede6' }}>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.logo}>STARLORD</div>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: 5 }}>ADMIN PANEL</div>
          </div>
          <Link href="/" style={{ fontSize: 13, color: '#555', fontWeight: 700 }}>← Back to Site</Link>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {['orders', 'products', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button onClick={loadData} style={{ ...s.btn, marginLeft: 'auto', background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>
            ↻ Refresh
          </button>
        </div>

        {loading && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>Loading...</div>}

        {/* ORDERS TAB */}
        {!loading && tab === 'orders' && (
          <div>
            {/* Filter strip */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  ...s.btn,
                  background: filter === f ? '#C9A84C' : '#141414',
                  color: filter === f ? '#000' : '#888',
                  border: '1px solid #2a2a2a',
                  fontSize: 11,
                  padding: '6px 14px',
                }}>
                  {f.toUpperCase()}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', color: '#555', fontSize: 13, alignSelf: 'center' }}>
                {filteredOrders.length} orders
              </span>
            </div>

            {filteredOrders.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No orders found</div>
            )}

            {filteredOrders.map(order => (
              <OrderRow key={order.id} order={order} onUpdate={updateOrderStatus} s={s} />
            ))}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {!loading && tab === 'products' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {products.map(product => (
                <ProductRow key={product.id} product={product} onUpdate={updateProduct} s={s} />
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {!loading && tab === 'analytics' && analytics && (
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 16, letterSpacing: 1 }}>THIS MONTH</div>
            <div style={s.statGrid}>
              {[
                { label: 'Revenue', value: formatRWF(analytics.revenue), gold: true },
                { label: 'Total Orders', value: analytics.totalOrders },
                { label: 'Delivered', value: analytics.delivered },
                { label: 'Pending', value: analytics.pending },
              ].map(stat => (
                <div key={stat.label} style={s.statCard}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: stat.gold ? '#C9A84C' : '#fff', marginBottom: 6 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function OrderRow({ order, onUpdate, s }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={s.card}>
      <div style={{ ...s.cardHead, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#C9A84C', marginBottom: 4 }}>
            {order.reference}
          </div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>{order.customer_name} · {order.customer_phone}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{formatDate(order.created_at)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {formatRWF(order.total)}
          </div>
          <span style={{ ...s.badge, background: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status] }}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 13, color: '#888', marginTop: 12, marginBottom: 8 }}>
            📍 {order.delivery_address}
          </div>

          {/* Items */}
          {order.order_items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1c1c1c', fontSize: 13 }}>
              <span style={{ color: '#ccc' }}>{item.products?.name} × {item.quantity}</span>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>{formatRWF(item.price_at_time * item.quantity)}</span>
            </div>
          ))}

          {/* Status actions */}
          {NEXT_STATUS[order.status] && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button
                onClick={() => onUpdate(order.id, NEXT_STATUS[order.status])}
                style={{ ...s.btn, background: '#C9A84C', color: '#000' }}
              >
                → Mark as {NEXT_STATUS[order.status]}
              </button>
              <button
                onClick={() => onUpdate(order.id, 'cancelled')}
                style={{ ...s.btn, background: '#2e1a1a', color: '#e05555', border: '1px solid #e05555' }}
              >
                Cancel Order
              </button>
              <a href={`tel:${order.customer_phone}`} style={{ ...s.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                📞 Call
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, onUpdate, s }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice]     = useState(String(product.price));
  const [stock, setStock]     = useState(String(product.stock));
  const [active, setActive]   = useState(product.is_active);

  const isLowStock  = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{product.name}</div>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{product.category}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(product.price)}</span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: isOutOfStock ? '#e05555' : isLowStock ? '#C9A84C' : '#4caf7d',
            }}>
              {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
            {!product.is_active && (
              <span style={{ fontSize: 11, color: '#555', background: '#1c1c1c', padding: '2px 8px', borderRadius: 4 }}>
                HIDDEN
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} style={{ ...s.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>

      {editing && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 6, fontWeight: 700 }}>PRICE (RWF)</div>
              <input style={s.input} value={price} onChange={e => setPrice(e.target.value)} type="number" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 6, fontWeight: 700 }}>STOCK</div>
              <input style={s.input} value={stock} onChange={e => setStock(e.target.value)} type="number" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} id={`active-${product.id}`} />
            <label htmlFor={`active-${product.id}`} style={{ fontSize: 13, color: '#888', cursor: 'pointer' }}>
              Visible on site
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => { onUpdate(product.id, price, stock, active); setEditing(false); }}
              style={{ ...s.btn, background: '#C9A84C', color: '#000' }}
            >
              Save Changes
            </button>
            <button onClick={() => setEditing(false)} style={{ ...s.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}