'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const ADMIN_SECRET = 'starlord2024admin';

function formatRWF(n)  { return `RWF ${Number(n || 0).toLocaleString()}`; }
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-RW', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const STATUS_COLOR = {
  pending:        '#C9A84C',
  confirmed:      '#4caf7d',
  preparing:      '#3498DB',
  dispatched:     '#9B59B6',
  delivered:      '#4caf7d',
  cancelled:      '#e05555',
  stock_conflict: '#e05555',
};
const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'preparing',
  preparing: 'dispatched', dispatched: 'delivered',
};
const LOG_ICONS = {
  ORDER_STATUS_CHANGED: '↺',
  PRODUCT_CREATED:      '+',
  PRODUCT_UPDATED:      '✎',
  PRODUCT_DELETED:      '✕',
  STOCK_ADJUSTED:       '▲',
  CATEGORY_CREATED:     '+',
  CATEGORY_UPDATED:     '✎',
  CATEGORY_DELETED:     '✕',
};

const S = {
  page:      { maxWidth: 1200, margin: '0 auto', padding: '24px 20px', fontFamily: "'Georgia', serif" },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #2a2a2a' },
  tabs:      { display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' },
  tab:       { padding: '8px 18px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#141414', color: '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 0.5 },
  tabActive: { background: '#C9A84C', color: '#000', borderColor: '#C9A84C' },
  card:      { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  badge:     { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, display: 'inline-block' },
  input:     { background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  btn:       { padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 },
  label:     { fontSize: 10, color: '#555', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block' },
  modal:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px' },
  modalBox:  { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 700, padding: 28 },
};

async function apiFetch(type, params = {}) {
  const qs  = new URLSearchParams({ secret: ADMIN_SECRET, type, ...params });
  const res = await fetch(`/api/admin/dashboard?${qs}`);
  return res.json();
}
async function apiMutate(method, body) {
  const res = await fetch(`/api/admin/dashboard?secret=${ADMIN_SECRET}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, gold, alert }) {
  return (
    <div style={{ background: '#141414', border: `1px solid ${alert ? '#e05555' : gold ? '#C9A84C44' : '#2a2a2a'}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: alert ? '#e05555' : gold ? '#C9A84C' : '#fff', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', background: d.total > 0 ? '#C9A84C' : '#1c1c1c', borderRadius: '3px 3px 0 0', height: `${Math.max((d.total / max) * 70, d.total > 0 ? 4 : 0)}px`, transition: 'height 0.3s' }} title={formatRWF(d.total)} />
          {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
            <div style={{ fontSize: 8, color: '#555', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── OrderModal ───────────────────────────────────────────────────────────────
function OrderModal({ orderId, onClose, onStatusChange }) {
  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    apiFetch('order_detail', { id: orderId }).then(({ data }) => {
      setOrder(data); setLoading(false);
    });
  }, [orderId]);

  const handleStatus = async (status) => {
    setUpdating(true);
    await apiMutate('PATCH', { type: 'order_status', id: orderId, status });
    const { data } = await apiFetch('order_detail', { id: orderId });
    setOrder(data); setUpdating(false); onStatusChange();
  };

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading...</div>
        ) : !order ? (
          <div style={{ textAlign: 'center', color: '#e05555', padding: 40 }}>Order not found</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#C9A84C' }}>{order.reference}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{formatDate(order.created_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ ...S.badge, background: STATUS_COLOR[order.status] + '22', color: STATUS_COLOR[order.status] }}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
                <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14 }}>
                <div style={S.label}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{order.customer_name}</div>
                <a href={`tel:${order.customer_phone}`} style={{ fontSize: 13, color: '#C9A84C', textDecoration: 'none' }}>{order.customer_phone}</a>
              </div>
              <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14 }}>
                <div style={S.label}>Delivery Address</div>
                <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>{order.delivery_address}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={S.label}>Order Items</div>
              {order.order_items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1c1c1c' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.products?.name}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{item.products?.category} · {formatRWF(item.price_at_time)} each</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#C9A84C', fontWeight: 800 }}>{formatRWF(item.price_at_time * item.quantity)}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>× {item.quantity}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                <span style={{ fontSize: 12, color: '#666' }}>Subtotal</span>
                <span style={{ fontSize: 12, color: '#ccc' }}>{formatRWF(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                <span style={{ fontSize: 12, color: '#666' }}>Delivery</span>
                <span style={{ fontSize: 12, color: '#ccc' }}>{formatRWF(order.delivery_fee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(order.total)}</span>
              </div>
            </div>

            <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', gap: 24 }}>
              <div>
                <div style={S.label}>Payment Method</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{order.payment_method || '—'}</div>
              </div>
              <div>
                <div style={S.label}>Payment Status</div>
                <span style={{ ...S.badge, background: order.payment_status === 'paid' ? '#4caf7d22' : '#C9A84C22', color: order.payment_status === 'paid' ? '#4caf7d' : '#C9A84C' }}>
                  {(order.payment_status || 'pending').toUpperCase()}
                </span>
              </div>
            </div>

            {NEXT_STATUS[order.status] && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button disabled={updating} onClick={() => handleStatus(NEXT_STATUS[order.status])} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>
                  {updating ? '...' : `Mark as ${NEXT_STATUS[order.status]}`}
                </button>
                <button disabled={updating} onClick={() => handleStatus('cancelled')} style={{ ...S.btn, background: '#2e1a1a', color: '#e05555', border: '1px solid #e05555' }}>
                  Cancel Order
                </button>
                <a href={`tel:${order.customer_phone}`} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', textDecoration: 'none' }}>
                  Call
                </a>
                <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', textDecoration: 'none' }}>
                  WhatsApp
                </a>
              </div>
            )}

            {order.logs?.length > 0 && (
              <div>
                <div style={S.label}>Activity Timeline</div>
                {order.logs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: '#C9A84C', fontWeight: 800, marginTop: 1, width: 16, textAlign: 'center' }}>{LOG_ICONS[log.action] || '·'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>
                        {log.action === 'ORDER_STATUS_CHANGED'
                          ? `Status: ${log.details?.from} → ${log.details?.to}`
                          : log.action.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: '#555' }}>{formatDate(log.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ProductModal ─────────────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSave }) {
  const isNew = !product;
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    name:        product?.name        || '',
    description: product?.description || '',
    category:    product?.category    || (categories?.[0]?.slug || 'accessories'),
    price:       product?.price       ? String(product.price)     : '',
    old_price:   product?.old_price   ? String(product.old_price) : '',
    stock:       product?.stock       ? String(product.stock)     : '',
    image_url:   product?.image_url   || '',
    badge:       product?.badge       || '',
    is_active:   product?.is_active   ?? true,
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      setError('Name, price and stock are required');
      return;
    }
    setError('');
    setSaving(true);
    let result;
    if (isNew) {
      result = await apiMutate('POST', form);
    } else {
      result = await apiMutate('PATCH', { type: 'product', id: product.id, ...form });
    }
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await onSave();
    onClose();
  };

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>{isNew ? 'NEW PRODUCT' : 'EDIT PRODUCT'}</div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#2e1a1a', border: '1px solid #e05555', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#e05555' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Name *</label>
            <input style={S.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. iPhone 15 Pro Case" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Description</label>
            <input style={S.input} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Short product description" />
          </div>
          <div>
            <label style={S.label}>Category</label>
            <select style={{ ...S.input, cursor: 'pointer' }} value={form.category} onChange={e => f('category', e.target.value)}>
              {categories?.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Badge (optional)</label>
            <input style={S.input} value={form.badge} onChange={e => f('badge', e.target.value)} placeholder="e.g. New, Sale, Hot" />
          </div>
          <div>
            <label style={S.label}>Price (RWF) *</label>
            <input style={S.input} type="number" value={form.price} onChange={e => f('price', e.target.value)} placeholder="e.g. 15000" />
          </div>
          <div>
            <label style={S.label}>Old Price (RWF)</label>
            <input style={S.input} type="number" value={form.old_price} onChange={e => f('old_price', e.target.value)} placeholder="Strike-through price" />
          </div>
          <div>
            <label style={S.label}>Stock *</label>
            <input style={S.input} type="number" value={form.stock} onChange={e => f('stock', e.target.value)} placeholder="e.g. 20" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <input type="checkbox" id="is_active_product" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
            <label htmlFor="is_active_product" style={{ fontSize: 13, color: '#888', cursor: 'pointer' }}>Visible on site</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Image URL</label>
            <input style={S.input} value={form.image_url} onChange={e => f('image_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── StockModal ───────────────────────────────────────────────────────────────
function StockModal({ product, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('');
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const preview = Math.max(0, (product?.stock || 0) + parseInt(adjustment || 0));

  const handleSave = async () => {
    if (!adjustment || parseInt(adjustment) === 0) { alert('Enter a non-zero adjustment'); return; }
    setSaving(true);
    await apiMutate('PATCH', { type: 'stock_adjust', id: product.id, adjustment: parseInt(adjustment), reason });
    setSaving(false);
    await onSave();
    onClose();
  };

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>ADJUST STOCK</div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>
        <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{product.name}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
            Current stock: <span style={{ color: '#C9A84C', fontWeight: 700 }}>{product.stock}</span>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Adjustment (+ to add, − to remove)</label>
          <input style={S.input} type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="e.g. 10 or -3" autoFocus />
          {adjustment && (
            <div style={{ fontSize: 12, color: preview === 0 ? '#e05555' : '#4caf7d', marginTop: 6 }}>
              New stock will be: <strong>{preview}</strong>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Reason (optional)</label>
          <input style={S.input} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Restocked from supplier" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Confirm Adjustment'}
          </button>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── CategoryModal ────────────────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSave }) {
  const isNew = !category;
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    name:        category?.name        || '',
    slug:        category?.slug        || '',
    description: category?.description || '',
    image_url:   category?.image_url   || '',
    sort_order:  category?.sort_order  !== undefined ? String(category.sort_order) : '0',
    is_active:   category?.is_active   ?? true,
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (val) => {
    f('name', val);
    if (isNew) f('slug', toSlug(val));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    setError('');
    setSaving(true);
    let result;
    if (isNew) {
      result = await apiMutate('POST', { type: 'category', ...form });
    } else {
      result = await apiMutate('PATCH', { type: 'category', id: category.id, ...form });
    }
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    await onSave();
    onClose();
  };

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>
            {isNew ? 'NEW CATEGORY' : 'EDIT CATEGORY'}
          </div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#2e1a1a', border: '1px solid #e05555', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#e05555' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Name *</label>
            <input style={S.input} value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Phone Cases" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Slug * (used in URLs)</label>
            <input style={S.input} value={form.slug} onChange={e => f('slug', toSlug(e.target.value))} placeholder="e.g. phone-cases" />
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Auto-generated from name. Only lowercase letters, numbers and hyphens.</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Description</label>
            <input style={S.input} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Short description of this category" />
          </div>
          <div>
            <label style={S.label}>Sort Order</label>
            <input style={S.input} type="number" value={form.sort_order} onChange={e => f('sort_order', e.target.value)} placeholder="0" />
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Lower number appears first.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <input type="checkbox" id="is_active_cat" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
            <label htmlFor="is_active_cat" style={{ fontSize: 13, color: '#888', cursor: 'pointer' }}>Active (visible on site)</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Image URL (optional)</label>
            <input style={S.input} value={form.image_url} onChange={e => f('image_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : isNew ? 'Create Category' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [password, setPassword] = useState('');
  const [tab,      setTab]      = useState('dashboard');
  const [loading,  setLoading]  = useState(false);

  const [orders,     setOrders]     = useState([]);
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics,  setAnalytics]  = useState(null);
  const [logs,       setLogs]       = useState([]);
  const [alerts,     setAlerts]     = useState([]);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [period,      setPeriod]      = useState('month');

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editProduct,     setEditProduct]     = useState(undefined); // undefined=closed, null=new, obj=edit
  const [stockProduct,    setStockProduct]    = useState(null);
  const [editCategory,    setEditCategory]    = useState(undefined); // undefined=closed, null=new, obj=edit

  const searchTimeout = useRef(null);

  const fetchOrders = useCallback(async (search = orderSearch, status = orderFilter) => {
    const params = { status };
    if (search) params.search = search;
    const { data } = await apiFetch('orders', params);
    setOrders(data || []);
  }, [orderSearch, orderFilter]);

  const fetchProducts   = useCallback(async () => { const { data } = await apiFetch('products');             setProducts(data || []); }, []);
  const fetchCategories = useCallback(async () => { const { data } = await apiFetch('categories');           setCategories(data || []); }, []);
  const fetchAnalytics  = useCallback(async () => { const { data } = await apiFetch('analytics', { period }); setAnalytics(data); }, [period]);
  const fetchLogs       = useCallback(async () => { const { data } = await apiFetch('logs');                  setLogs(data || []); }, []);
  const fetchAlerts     = useCallback(async () => { const { data } = await apiFetch('stock_alerts');          setAlerts(data || []); }, []);

  const loadTab = async () => {
    setLoading(true);
    if      (tab === 'dashboard')  await Promise.all([fetchOrders('', 'pending'), fetchAlerts(), fetchAnalytics()]);
    else if (tab === 'orders')     await fetchOrders();
    else if (tab === 'products')   await Promise.all([fetchProducts(), fetchCategories()]);
    else if (tab === 'categories') await fetchCategories();
    else if (tab === 'analytics')  await fetchAnalytics();
    else if (tab === 'logs')       await fetchLogs();
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    loadTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab, period]);

  const handleSearchChange = (val) => {
    setOrderSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchOrders(val, orderFilter), 400);
  };

  const handleLogin = () => {
    if (password === ADMIN_SECRET) setAuthed(true);
    else alert('Wrong password');
  };

  const btnFilter = (active) => ({
    ...S.btn, background: active ? '#C9A84C' : '#141414',
    color: active ? '#000' : '#666', border: '1px solid #2a2a2a', fontSize: 11, padding: '5px 12px',
  });

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?\n\nThis will fail if any products are still using this category.`)) return;
    const result = await apiMutate('DELETE', { type: 'category', id: cat.id });
    if (result.error) { alert(result.error); return; }
    await fetchCategories();
  };

  const handleDeleteProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await apiMutate('DELETE', { id: p.id });
    await fetchProducts();
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 340, padding: 32, background: '#141414', borderRadius: 16, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#C9A84C', letterSpacing: 3, textAlign: 'center', marginBottom: 4 }}>STARLORD</div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 5, textAlign: 'center', marginBottom: 32 }}>ADMIN PANEL</div>
          <input type="password" placeholder="Admin password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...S.input, marginBottom: 12 }} autoFocus />
          <button onClick={handleLogin} style={{ ...S.btn, width: '100%', background: '#C9A84C', color: '#000', padding: '12px', justifyContent: 'center' }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  const pendingOrders = tab === 'dashboard' ? orders : [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0ede6' }}>
      <div style={S.page}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#C9A84C', letterSpacing: 3 }}>STARLORD</div>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: 5 }}>ADMIN PANEL</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {alerts.length > 0 && (
              <div style={{ background: '#2e1a00', border: '1px solid #C9A84C', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                {alerts.length} low stock
              </div>
            )}
            <Link href="/" style={{ fontSize: 12, color: '#555', fontWeight: 700, textDecoration: 'none' }}>Back to Site</Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {[
            { id: 'dashboard',  label: 'Dashboard'     },
            { id: 'orders',     label: 'Orders'        },
            { id: 'products',   label: 'Products'      },
            { id: 'categories', label: 'Categories'    },
            { id: 'analytics',  label: 'Analytics'     },
            { id: 'logs',       label: 'Activity Log'  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
          <button onClick={loadTab} style={{ ...S.btn, marginLeft: 'auto', background: '#1c1c1c', color: '#666', border: '1px solid #2a2a2a' }}>
            Refresh
          </button>
        </div>

        {loading && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>Loading...</div>}

        {/* ── DASHBOARD ── */}
        {!loading && tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <StatCard label="Revenue This Month" value={formatRWF(analytics?.revenue)} gold />
              <StatCard label="Pending Orders"     value={pendingOrders.length} alert={pendingOrders.length > 0} />
              <StatCard label="Low Stock Items"    value={alerts.length} alert={alerts.length > 0} />
              <StatCard label="Delivered"          value={analytics?.delivered || 0} />
            </div>
            {analytics?.dailyRevenue && (
              <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={S.label}>Revenue — Last 14 Days</div>
                <BarChart data={analytics.dailyRevenue} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={S.label}>Pending Orders</div>
                {pendingOrders.length === 0 ? (
                  <div style={{ color: '#555', fontSize: 13, padding: '20px 0' }}>No pending orders</div>
                ) : pendingOrders.slice(0, 5).map(o => (
                  <div key={o.id} onClick={() => setSelectedOrderId(o.id)}
                    style={{ ...S.card, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#C9A84C' }}>{o.reference}</div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{o.customer_name} · {timeAgo(o.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{formatRWF(o.total)}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={S.label}>Low Stock Alerts</div>
                {alerts.length === 0 ? (
                  <div style={{ color: '#555', fontSize: 13, padding: '20px 0' }}>All products well stocked</div>
                ) : alerts.map(p => (
                  <div key={p.id} style={{ ...S.card, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{p.category}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: p.stock === 0 ? '#e05555' : '#C9A84C' }}>
                        {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                      </span>
                      <button onClick={() => setStockProduct(p)} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 11 }}>
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {!loading && tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input style={{ ...S.input, maxWidth: 300 }}
                placeholder="Search reference, name or phone..."
                value={orderSearch}
                onChange={e => handleSearchChange(e.target.value)} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'].map(f => (
                  <button key={f} onClick={() => { setOrderFilter(f); fetchOrders(orderSearch, f); }} style={btnFilter(orderFilter === f)}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{orders.length} orders</span>
            </div>
            {orders.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No orders found</div>}
            {orders.map(order => (
              <div key={order.id} onClick={() => setSelectedOrderId(order.id)}
                style={{ ...S.card, padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{order.reference}</span>
                    <span style={{ ...S.badge, background: STATUS_COLOR[order.status] + '22', color: STATUS_COLOR[order.status] }}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{order.customer_name} · {order.customer_phone}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{formatDate(order.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{formatRWF(order.total)}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Click to view</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {!loading && tab === 'products' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              <button onClick={() => setEditProduct(null)} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>
                + New Product
              </button>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{products.length} products</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {products.map(p => {
                const low = p.stock <= 5 && p.stock > 0;
                const out = p.stock === 0;
                return (
                  <div key={p.id} style={S.card}>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{p.category}</div>
                        </div>
                        {p.badge && <span style={{ ...S.badge, background: '#C9A84C22', color: '#C9A84C', marginLeft: 8 }}>{p.badge}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(p.price)}</span>
                        {p.old_price && <span style={{ fontSize: 12, color: '#555', textDecoration: 'line-through' }}>{formatRWF(p.old_price)}</span>}
                        <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 'auto', color: out ? '#e05555' : low ? '#C9A84C' : '#4caf7d' }}>
                          {out ? 'Out of stock' : low ? `${p.stock} left` : `${p.stock} in stock`}
                        </span>
                      </div>
                      {!p.is_active && (
                        <div style={{ fontSize: 11, color: '#555', background: '#1c1c1c', padding: '3px 8px', borderRadius: 4, marginBottom: 10, display: 'inline-block' }}>HIDDEN</div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditProduct(p)} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', flex: 1, justifyContent: 'center' }}>Edit</button>
                        <button onClick={() => setStockProduct(p)} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', flex: 1, justifyContent: 'center' }}>Stock</button>
                        <button onClick={() => handleDeleteProduct(p)} style={{ ...S.btn, background: '#2e1a1a', color: '#e05555', border: '1px solid #e0555533' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {!loading && tab === 'categories' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              <button onClick={() => setEditCategory(null)} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>
                + New Category
              </button>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{categories.length} categories</span>
            </div>

            {categories.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No categories yet</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {categories.map(cat => (
                <div key={cat.id} style={S.card}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 4 }}>/{cat.slug}</div>
                        {cat.description && (
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{cat.description}</div>
                        )}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#555' }}>Order: {cat.sort_order}</span>
                          <span style={{ ...S.badge, background: cat.is_active ? '#4caf7d22' : '#1c1c1c', color: cat.is_active ? '#4caf7d' : '#555' }}>
                            {cat.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditCategory(cat)} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', flex: 1, justifyContent: 'center' }}>Edit</button>
                      <button onClick={() => handleDeleteCategory(cat)} style={{ ...S.btn, background: '#2e1a1a', color: '#e05555', border: '1px solid #e0555533' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {!loading && tab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['today', 'week', 'month'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={btnFilter(period === p)}>{p.toUpperCase()}</button>
              ))}
            </div>
            {analytics && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  <StatCard label="Revenue (Paid)" value={formatRWF(analytics.revenue)} gold sub={`${analytics.paidOrders} paid orders`} />
                  <StatCard label="Total Orders"    value={analytics.totalOrders} />
                  <StatCard label="Delivered"       value={analytics.delivered} />
                  <StatCard label="Avg Order Value" value={formatRWF(analytics.avg)} />
                </div>
                <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <div style={S.label}>Daily Revenue — Last 14 Days</div>
                  <BarChart data={analytics.dailyRevenue} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18 }}>
                    <div style={S.label}>Order Status Breakdown</div>
                    {Object.entries(analytics.statusCounts || {}).map(([status, count]) => (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status] || '#555' }} />
                          <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18 }}>
                    <div style={S.label}>Top Products by Revenue</div>
                    {analytics.topProducts?.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>No sales data yet</div>}
                    {analytics.topProducts?.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#555' }}>{p.qty} units sold</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ACTIVITY LOG ── */}
        {!loading && tab === 'logs' && (
          <div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 16, letterSpacing: 1 }}>{logs.length} entries — most recent first</div>
            {logs.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No activity logged yet</div>}
            {logs.map(log => (
              <div key={log.id} style={{ ...S.card, padding: '12px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, color: '#C9A84C', fontWeight: 800, marginTop: 2, width: 16, textAlign: 'center', flexShrink: 0 }}>
                  {LOG_ICONS[log.action] || '·'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{log.action.replace(/_/g, ' ')}</span>
                      {log.entity_ref && (
                        <span style={{ fontSize: 12, color: '#C9A84C', marginLeft: 8, fontFamily: 'monospace' }}>{log.entity_ref}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'monospace', background: '#0a0a0a', padding: '4px 8px', borderRadius: 4, display: 'inline-block', maxWidth: '100%', wordBreak: 'break-all' }}>
                      {log.action === 'ORDER_STATUS_CHANGED'
                        ? `${log.details.from} → ${log.details.to}`
                        : log.action === 'STOCK_ADJUSTED'
                        ? `${log.details.from} → ${log.details.to} (${log.details.adjustment > 0 ? '+' : ''}${log.details.adjustment})${log.details.reason ? ` · ${log.details.reason}` : ''}`
                        : Object.entries(log.details).map(([k, v]) =>
                            typeof v === 'object' && v !== null ? `${k}: ${v.from} → ${v.to}` : `${k}: ${v}`
                          ).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{timeAgo(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modals */}
      {selectedOrderId && (
        <OrderModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} onStatusChange={() => fetchOrders()} />
      )}
      {editProduct !== undefined && (
        <ProductModal product={editProduct} categories={categories} onClose={() => setEditProduct(undefined)} onSave={fetchProducts} />
      )}
      {stockProduct && (
        <StockModal product={stockProduct} onClose={() => setStockProduct(null)} onSave={fetchProducts} />
      )}
      {editCategory !== undefined && (
        <CategoryModal category={editCategory} onClose={() => setEditCategory(undefined)} onSave={fetchCategories} />
      )}
    </div>
  );
}