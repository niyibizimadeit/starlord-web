'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ADMIN_SECRET, S, formatRWF, formatDate, timeAgo, toSlug,
  STATUS_COLOR, NEXT_STATUS, LOG_ICONS,
  apiFetch, apiMutate, downloadCSV, printRevenueReport, printShippingLabel,
  StatCard, BarChart, ImageUploader, StockModal, CategoryModal,
} from './AdminHelpers';

// ─── Order Modal ──────────────────────────────────────────────────────────────
function OrderModal({ orderId, onClose, onStatusChange }) {
  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    apiFetch('order_detail', { id: orderId }).then(({ data }) => { setOrder(data); setLoading(false); });
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
        {loading ? <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading...</div>
        : !order   ? <div style={{ textAlign: 'center', color: '#e05555', padding: 40 }}>Order not found</div>
        : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#C9A84C' }}>{order.reference}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{formatDate(order.created_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ ...S.badge, background: STATUS_COLOR[order.status] + '22', color: STATUS_COLOR[order.status] }}>{order.status.replace('_', ' ').toUpperCase()}</span>
              <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
            </div>
          </div>

          <button onClick={() => printShippingLabel(order)} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33', marginBottom: 16 }}>
            Print Shipping Label
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
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

          <div style={{ marginBottom: 16 }}>
            <div style={S.label}>Items</div>
            {order.order_items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
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
              <span style={{ fontSize: 12, color: '#666' }}>Subtotal</span><span style={{ fontSize: 12, color: '#ccc' }}>{formatRWF(order.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
              <span style={{ fontSize: 12, color: '#666' }}>Delivery</span><span style={{ fontSize: 12, color: '#ccc' }}>{formatRWF(order.delivery_fee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(order.total)}</span>
            </div>
          </div>

          <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 24 }}>
            <div><div style={S.label}>Payment</div><div style={{ fontSize: 13, color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{order.payment_method || '—'}</div></div>
            <div>
              <div style={S.label}>Status</div>
              <span style={{ ...S.badge, background: order.payment_status === 'paid' ? '#4caf7d22' : '#C9A84C22', color: order.payment_status === 'paid' ? '#4caf7d' : '#C9A84C' }}>
                {(order.payment_status || 'pending').toUpperCase()}
              </span>
            </div>
          </div>

          {NEXT_STATUS[order.status] && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button disabled={updating} onClick={() => handleStatus(NEXT_STATUS[order.status])} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>
                {updating ? '...' : `Mark as ${NEXT_STATUS[order.status]}`}
              </button>
              <button disabled={updating} onClick={() => handleStatus('cancelled')} style={{ ...S.btn, background: '#2e1a1a', color: '#e05555', border: '1px solid #e05555' }}>Cancel</button>
              <a href={`tel:${order.customer_phone}`} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', textDecoration: 'none' }}>Call</a>
              <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', textDecoration: 'none' }}>WhatsApp</a>
            </div>
          )}

          {order.logs?.length > 0 && (
            <div>
              <div style={S.label}>Activity Timeline</div>
              {order.logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#C9A84C', fontWeight: 800, width: 16, textAlign: 'center', marginTop: 1 }}>{LOG_ICONS[log.action] || '·'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>{log.action === 'ORDER_STATUS_CHANGED' ? `Status: ${log.details?.from} → ${log.details?.to}` : log.action.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{formatDate(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSave }) {
  const isNew = !product;
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [savedId, setSavedId] = useState(product?.id || null);
  const [images,  setImages]  = useState(product?.product_images || []);
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    category: product?.category || (categories?.[0]?.slug || 'accessories'),
    price: product?.price ? String(product.price) : '',
    old_price: product?.old_price ? String(product.old_price) : '',
    stock: product?.stock ? String(product.stock) : '',
    badge: product?.badge || '', is_active: product?.is_active ?? true,
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) { setError('Name, price and stock are required'); return; }
    setError(''); setSaving(true);
    let result;
    if (isNew && !savedId) {
      result = await apiMutate('POST', form);
      if (result.error) { setError(result.error); setSaving(false); return; }
      setSavedId(result.data.id);
    } else {
      result = await apiMutate('PATCH', { type: 'product', id: savedId || product.id, ...form });
      if (result.error) { setError(result.error); setSaving(false); return; }
    }
    setSaving(false);
    await onSave();
    if (!isNew) onClose();
  };

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>{isNew ? (savedId ? 'ADD IMAGES' : 'NEW PRODUCT') : 'EDIT PRODUCT'}</div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>
        {error && <div style={{ background: '#2e1a1a', border: '1px solid #e05555', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#e05555' }}>{error}</div>}

        {(!isNew || !savedId) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. iPhone 15 Pro Case" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Description</label><input style={S.input} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Short description" /></div>
            <div>
              <label style={S.label}>Category</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.category} onChange={e => f('category', e.target.value)}>
                {categories?.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Badge</label><input style={S.input} value={form.badge} onChange={e => f('badge', e.target.value)} placeholder="e.g. New, Sale" /></div>
            <div><label style={S.label}>Price (RWF) *</label><input style={S.input} type="number" value={form.price} onChange={e => f('price', e.target.value)} /></div>
            <div><label style={S.label}>Old Price (RWF)</label><input style={S.input} type="number" value={form.old_price} onChange={e => f('old_price', e.target.value)} /></div>
            <div><label style={S.label}>Stock *</label><input style={S.input} type="number" value={form.stock} onChange={e => f('stock', e.target.value)} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
              <input type="checkbox" id="is_active_p" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
              <label htmlFor="is_active_p" style={{ fontSize: 13, color: '#888', cursor: 'pointer' }}>Visible on site</label>
            </div>
          </div>
        )}

        {(!isNew || savedId) && (
          <div style={{ marginBottom: 20 }}>
            <ImageUploader productId={savedId || product?.id} images={images} onImagesChange={setImages} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {(!isNew || !savedId) && (
            <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : isNew ? 'Save & Add Images' : 'Save Changes'}
            </button>
          )}
          {isNew && savedId && <button onClick={async () => { await onSave(); onClose(); }} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>Done</button>}
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>{isNew && savedId ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({ userId, onClose }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('user_detail', { id: userId }).then(({ data }) => { setUser(data); setLoading(false); });
  }, [userId]);

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        {loading ? <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading...</div>
        : !user   ? <div style={{ textAlign: 'center', color: '#e05555', padding: 40 }}>User not found</div>
        : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{user.full_name || 'No name'}</div>
              <div style={{ fontSize: 13, color: '#C9A84C', marginTop: 2 }}>{user.phone}</div>
              {user.email && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{user.email}</div>}
            </div>
            <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <StatCard label="Orders"    value={user.order_count || 0} />
            <StatCard label="Spent"     value={formatRWF(user.total_spent)} gold />
            <StatCard label="Since"     value={new Date(user.created_at).toLocaleDateString('en-RW', { month: 'short', year: 'numeric' })} />
          </div>
          <div style={S.label}>Order History</div>
          {user.orders?.length === 0 && <div style={{ color: '#555', fontSize: 13, padding: '16px 0' }}>No orders yet</div>}
          {user.orders?.map((o, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1c1c1c' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#C9A84C' }}>{o.reference}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{formatDate(o.created_at)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{formatRWF(o.total)}</div>
                <span style={{ ...S.badge, background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>{o.status}</span>
              </div>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
  const [users,      setUsers]      = useState([]);
  const [segments,   setSegments]   = useState(null);

  const [orderSearch,   setOrderSearch]   = useState('');
  const [orderFilter,   setOrderFilter]   = useState('all');
  const [period,        setPeriod]        = useState('month');
  const [reportPeriod,  setReportPeriod]  = useState('month');
  const [userSearch,    setUserSearch]    = useState('');
  const [segmentTab,    setSegmentTab]    = useState('high_value');

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editProduct,     setEditProduct]     = useState(undefined);
  const [stockProduct,    setStockProduct]    = useState(null);
  const [editCategory,    setEditCategory]    = useState(undefined);
  const [selectedUserId,  setSelectedUserId]  = useState(null);

  const searchTimeout     = useRef(null);
  const userSearchTimeout = useRef(null);

  const fetchOrders     = useCallback(async (search = orderSearch, status = orderFilter) => {
    const p = { status }; if (search) p.search = search;
    const { data } = await apiFetch('orders', p); setOrders(data || []);
  }, [orderSearch, orderFilter]);
  const fetchProducts   = useCallback(async () => { const { data } = await apiFetch('products');             setProducts(data || []); }, []);
  const fetchCategories = useCallback(async () => { const { data } = await apiFetch('categories');           setCategories(data || []); }, []);
  const fetchAnalytics  = useCallback(async () => { const { data } = await apiFetch('analytics', { period }); setAnalytics(data); }, [period]);
  const fetchLogs       = useCallback(async () => { const { data } = await apiFetch('logs');                  setLogs(data || []); }, []);
  const fetchAlerts     = useCallback(async () => { const { data } = await apiFetch('stock_alerts');          setAlerts(data || []); }, []);
  const fetchUsers      = useCallback(async (search = userSearch) => {
    const p = {}; if (search) p.search = search;
    const { data } = await apiFetch('users', p); setUsers(data || []);
  }, [userSearch]);
  const fetchSegments   = useCallback(async () => { const { data } = await apiFetch('segments'); setSegments(data); }, []);

  const loadTab = async () => {
    setLoading(true);
    if      (tab === 'dashboard')  await Promise.all([fetchOrders('', 'pending'), fetchAlerts(), fetchAnalytics()]);
    else if (tab === 'orders')     await fetchOrders();
    else if (tab === 'products')   await Promise.all([fetchProducts(), fetchCategories()]);
    else if (tab === 'categories') await fetchCategories();
    else if (tab === 'analytics')  await fetchAnalytics();
    else if (tab === 'reports')    await fetchAnalytics();
    else if (tab === 'users')      await fetchUsers();
    else if (tab === 'segments')   await fetchSegments();
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
  const handleUserSearchChange = (val) => {
    setUserSearch(val);
    clearTimeout(userSearchTimeout.current);
    userSearchTimeout.current = setTimeout(() => fetchUsers(val), 400);
  };
  const handleLogin = () => { if (password === ADMIN_SECRET) setAuthed(true); else alert('Wrong password'); };

  const btnFilter = (active) => ({
    ...S.btn, background: active ? '#C9A84C' : '#141414', color: active ? '#000' : '#666', border: '1px solid #2a2a2a', fontSize: 11, padding: '5px 12px',
  });

  const exportOrdersCSV = async () => {
    const { data } = await apiFetch('export_orders');
    if (!data?.length) { alert('No orders to export'); return; }
    const rows = [['Reference', 'Date', 'Customer', 'Phone', 'Address', 'Subtotal', 'Delivery', 'Total', 'Status', 'Payment Status', 'Payment Method']];
    data.forEach(o => rows.push([o.reference, o.created_at, o.customer_name, o.customer_phone, o.delivery_address, o.subtotal, o.delivery_fee, o.total, o.status, o.payment_status, o.payment_method]));
    downloadCSV(rows, `starlord_orders_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const exportProductsCSV = async () => {
    const { data } = await apiFetch('export_products');
    if (!data?.length) { alert('No products to export'); return; }
    const rows = [['ID', 'Name', 'Category', 'Price (RWF)', 'Old Price', 'Stock', 'Badge', 'Active', 'Created']];
    data.forEach(p => rows.push([p.id, p.name, p.category, p.price, p.old_price || '', p.stock, p.badge || '', p.is_active, p.created_at]));
    downloadCSV(rows, `starlord_products_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const exportUsersCSV = async () => {
    const { data } = await apiFetch('export_users');
    if (!data?.length) { alert('No customers to export'); return; }
    const rows = [['Phone', 'Name', 'Email', 'Orders', 'Total Spent (RWF)', 'Registered']];
    data.forEach(u => rows.push([u.phone, u.full_name || '', u.email || '', u.order_count || 0, u.total_spent || 0, u.created_at]));
    downloadCSV(rows, `starlord_customers_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete "${cat.name}"?\nThis will fail if products still use it.`)) return;
    const result = await apiMutate('DELETE', { type: 'category', id: cat.id });
    if (result.error) { alert(result.error); return; }
    await fetchCategories();
  };
  const handleDeleteProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"? Cannot be undone.`)) return;
    await apiMutate('DELETE', { id: p.id }); await fetchProducts();
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 340, padding: 32, background: '#141414', borderRadius: 16, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#C9A84C', letterSpacing: 3, textAlign: 'center', marginBottom: 4 }}>STARLORD</div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 5, textAlign: 'center', marginBottom: 32 }}>ADMIN PANEL</div>
          <input type="password" placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ ...S.input, marginBottom: 12 }} autoFocus />
          <button onClick={handleLogin} style={{ ...S.btn, width: '100%', background: '#C9A84C', color: '#000', padding: '12px', justifyContent: 'center' }}>Enter</button>
        </div>
      </div>
    );
  }

  const pendingOrders = tab === 'dashboard' ? orders : [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0ede6' }}>
      <div style={S.page}>

        <div style={S.header}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#C9A84C', letterSpacing: 3 }}>STARLORD</div>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: 5 }}>ADMIN PANEL</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {alerts.length > 0 && <div style={{ background: '#2e1a00', border: '1px solid #C9A84C', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>{alerts.length} low stock</div>}
            <Link href="/" style={{ fontSize: 12, color: '#555', fontWeight: 700, textDecoration: 'none' }}>Back to Site</Link>
          </div>
        </div>

        <div style={S.tabs}>
          {[
            { id: 'dashboard',  label: 'Dashboard'    },
            { id: 'orders',     label: 'Orders'       },
            { id: 'products',   label: 'Products'     },
            { id: 'categories', label: 'Categories'   },
            { id: 'analytics',  label: 'Analytics'    },
            { id: 'reports',    label: 'Reports'      },
            { id: 'users',      label: 'Customers'    },
            { id: 'segments',   label: 'Segments'     },
            { id: 'logs',       label: 'Activity Log' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>{t.label}</button>
          ))}
          <button onClick={loadTab} style={{ ...S.btn, marginLeft: 'auto', background: '#1c1c1c', color: '#666', border: '1px solid #2a2a2a' }}>Refresh</button>
        </div>

        {loading && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>Loading...</div>}

        {/* DASHBOARD */}
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
                {pendingOrders.length === 0
                  ? <div style={{ color: '#555', fontSize: 13, padding: '20px 0' }}>No pending orders</div>
                  : pendingOrders.slice(0, 5).map(o => (
                    <div key={o.id} onClick={() => setSelectedOrderId(o.id)} style={{ ...S.card, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {alerts.length === 0
                  ? <div style={{ color: '#555', fontSize: 13, padding: '20px 0' }}>All products well stocked</div>
                  : alerts.map(p => (
                    <div key={p.id} style={{ ...S.card, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{p.category}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: p.stock === 0 ? '#e05555' : '#C9A84C' }}>{p.stock === 0 ? 'OUT' : `${p.stock} left`}</span>
                        <button onClick={() => setStockProduct(p)} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 11 }}>Restock</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {!loading && tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input style={{ ...S.input, maxWidth: 280 }} placeholder="Search reference, name or phone..." value={orderSearch} onChange={e => handleSearchChange(e.target.value)} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all','pending','confirmed','preparing','dispatched','delivered','cancelled'].map(f => (
                  <button key={f} onClick={() => { setOrderFilter(f); fetchOrders(orderSearch, f); }} style={btnFilter(orderFilter === f)}>{f.toUpperCase()}</button>
                ))}
              </div>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{orders.length} orders</span>
              <button onClick={exportOrdersCSV} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export CSV</button>
            </div>
            {orders.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No orders found</div>}
            {orders.map(order => (
              <div key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ ...S.card, padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{order.reference}</span>
                    <span style={{ ...S.badge, background: STATUS_COLOR[order.status] + '22', color: STATUS_COLOR[order.status] }}>{order.status.replace('_', ' ').toUpperCase()}</span>
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

        {/* PRODUCTS */}
        {!loading && tab === 'products' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setEditProduct(null)} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>+ New Product</button>
              <button onClick={exportProductsCSV} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export CSV</button>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{products.length} products</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {products.map(p => {
                const low = p.stock <= 5 && p.stock > 0;
                const out = p.stock === 0;
                const thumb = p.product_images?.[0]?.url;
                const imgCnt = p.product_images?.length || 0;
                return (
                  <div key={p.id} style={S.card}>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        {thumb
                          ? <div style={{ position: 'relative', flexShrink: 0 }}>
                              <img src={thumb} alt={p.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a2a2a' }} />
                              {imgCnt > 1 && <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.7)', borderRadius: 3, fontSize: 9, color: '#fff', padding: '1px 4px', fontWeight: 700 }}>+{imgCnt - 1}</div>}
                            </div>
                          : <div style={{ width: 60, height: 60, background: '#1c1c1c', borderRadius: 8, border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 9, color: '#444' }}>No img</span>
                            </div>
                        }
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{p.category}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(p.price)}</span>
                            {p.badge && <span style={{ ...S.badge, background: '#C9A84C22', color: '#C9A84C' }}>{p.badge}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: out ? '#e05555' : low ? '#C9A84C' : '#4caf7d' }}>
                          {out ? 'Out of stock' : low ? `${p.stock} left` : `${p.stock} in stock`}
                        </span>
                        {!p.is_active && <span style={{ fontSize: 11, color: '#555', background: '#1c1c1c', padding: '3px 8px', borderRadius: 4 }}>HIDDEN</span>}
                      </div>
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

        {/* CATEGORIES */}
        {!loading && tab === 'categories' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              <button onClick={() => setEditCategory(null)} style={{ ...S.btn, background: '#C9A84C', color: '#000' }}>+ New Category</button>
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{categories.length} categories</span>
            </div>
            {categories.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No categories yet</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {categories.map(cat => (
                <div key={cat.id} style={S.card}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 4 }}>/{cat.slug}</div>
                    {cat.description && <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{cat.description}</div>}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#555' }}>Order: {cat.sort_order}</span>
                      <span style={{ ...S.badge, background: cat.is_active ? '#4caf7d22' : '#1c1c1c', color: cat.is_active ? '#4caf7d' : '#555' }}>{cat.is_active ? 'Active' : 'Hidden'}</span>
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

        {/* ANALYTICS */}
        {!loading && tab === 'analytics' && analytics && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['today','week','month'].map(p => <button key={p} onClick={() => setPeriod(p)} style={btnFilter(period === p)}>{p.toUpperCase()}</button>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <StatCard label="Revenue (Paid)" value={formatRWF(analytics.revenue)} gold sub={`${analytics.paidOrders} paid orders`} />
              <StatCard label="Total Orders"   value={analytics.totalOrders} />
              <StatCard label="Delivered"      value={analytics.delivered} />
              <StatCard label="Avg Order"      value={formatRWF(analytics.avg)} />
            </div>
            <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={S.label}>Sales Trend — Last 14 Days</div>
              <BarChart data={analytics.dailyRevenue} height={120} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18 }}>
                <div style={S.label}>Best-Selling Products</div>
                {analytics.topProducts?.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>No data yet</div>}
                {analytics.topProducts?.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                    <div><div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{i + 1}. {p.name}</div><div style={{ fontSize: 11, color: '#555' }}>{p.qty} units</div></div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(p.revenue)}</span>
                  </div>
                ))}
              </div>
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
            </div>
            <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18 }}>
              <div style={S.label}>Inventory Movement — Sales Velocity</div>
              {analytics.topProducts?.map((p, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #1c1c1c' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{p.qty} sold</span>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: '#C9A84C', height: '100%', width: `${Math.min((p.qty / (analytics.topProducts[0]?.qty || 1)) * 100, 100)}%`, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {!loading && tab === 'reports' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: 1, marginRight: 4 }}>PERIOD</div>
              {['today','week','month','quarter','year'].map(p => (
                <button key={p} onClick={() => { setReportPeriod(p); setPeriod(p); }} style={btnFilter(reportPeriod === p)}>{p.toUpperCase()}</button>
              ))}
            </div>
            {analytics && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                <StatCard label="Revenue" value={formatRWF(analytics.revenue)} gold />
                <StatCard label="Orders"  value={analytics.totalOrders} />
                <StatCard label="Paid"    value={analytics.paidOrders} />
                <StatCard label="Avg Order" value={formatRWF(analytics.avg)} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button onClick={() => printRevenueReport(analytics, reportPeriod)} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Download PDF Report</button>
                <button onClick={exportOrdersCSV}   style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export Orders CSV</button>
                <button onClick={exportProductsCSV} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export Products CSV</button>
                <button onClick={exportUsersCSV}    style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export Customers CSV</button>
              </div>
              <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={S.label}>Daily Revenue</div>
                <BarChart data={analytics.dailyRevenue} height={140} />
              </div>
              <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18 }}>
                <div style={S.label}>Top Products by Revenue</div>
                {analytics.topProducts?.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1c1c1c' }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{i + 1}. {p.name}</div><div style={{ fontSize: 11, color: '#555' }}>{p.qty} units · {p.category}</div></div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* CUSTOMERS */}
        {!loading && tab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...S.input, maxWidth: 280 }} placeholder="Search by name or phone..." value={userSearch} onChange={e => handleUserSearchChange(e.target.value)} />
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{users.length} customers</span>
              <button onClick={exportUsersCSV} style={{ ...S.btn, background: '#1c2a1a', color: '#4caf7d', border: '1px solid #4caf7d33' }}>Export CSV</button>
            </div>
            {users.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No customers found</div>}
            {users.map(u => (
              <div key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ ...S.card, padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{u.full_name || 'No name'}</div>
                  <div style={{ fontSize: 13, color: '#C9A84C' }}>{u.phone}</div>
                  {u.email && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{u.email}</div>}
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Since {new Date(u.created_at).toLocaleDateString('en-RW', { month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(u.total_spent)}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{u.order_count || 0} orders</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEGMENTS */}
        {!loading && tab === 'segments' && segments && (
          <div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
              High-Value: spent over RWF 50,000 · Frequent: 3+ orders · Inactive: no order in 30+ days
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'high_value', label: `High-Value (${segments.high_value?.length || 0})` },
                { id: 'frequent',   label: `Frequent (${segments.frequent?.length || 0})` },
                { id: 'inactive',   label: `Inactive (${segments.inactive?.length || 0})` },
              ].map(s => <button key={s.id} onClick={() => setSegmentTab(s.id)} style={btnFilter(segmentTab === s.id)}>{s.label}</button>)}
            </div>
            {(segments[segmentTab] || []).length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>No customers in this segment</div>}
            {(segments[segmentTab] || []).map(u => (
              <div key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ ...S.card, padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{u.full_name || 'No name'}</div>
                  <div style={{ fontSize: 13, color: '#C9A84C' }}>{u.phone}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    {segmentTab === 'inactive' && u.last_order_date ? `Last order: ${timeAgo(u.last_order_date)}` : `${u.order_count || 0} orders`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#C9A84C' }}>{formatRWF(u.total_spent)}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{u.order_count || 0} orders</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY LOG */}
        {!loading && tab === 'logs' && (
          <div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 16, letterSpacing: 1 }}>{logs.length} entries — most recent first</div>
            {logs.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 60 }}>No activity logged yet</div>}
            {logs.map(log => (
              <div key={log.id} style={{ ...S.card, padding: '12px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, color: '#C9A84C', fontWeight: 800, marginTop: 2, width: 16, textAlign: 'center', flexShrink: 0 }}>{LOG_ICONS[log.action] || '·'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{log.action.replace(/_/g, ' ')}</span>
                      {log.entity_ref && <span style={{ fontSize: 12, color: '#C9A84C', marginLeft: 8, fontFamily: 'monospace' }}>{log.entity_ref}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'monospace', background: '#0a0a0a', padding: '4px 8px', borderRadius: 4, display: 'inline-block', maxWidth: '100%', wordBreak: 'break-all' }}>
                      {log.action === 'ORDER_STATUS_CHANGED' ? `${log.details.from} → ${log.details.to}`
                        : log.action === 'STOCK_ADJUSTED' ? `${log.details.from} → ${log.details.to} (${log.details.adjustment > 0 ? '+' : ''}${log.details.adjustment})${log.details.reason ? ` · ${log.details.reason}` : ''}`
                        : Object.entries(log.details).map(([k, v]) => typeof v === 'object' && v !== null ? `${k}: ${v.from} → ${v.to}` : `${k}: ${v}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{timeAgo(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {selectedOrderId && <OrderModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} onStatusChange={fetchOrders} />}
      {editProduct !== undefined && <ProductModal product={editProduct} categories={categories} onClose={() => setEditProduct(undefined)} onSave={fetchProducts} />}
      {stockProduct && <StockModal product={stockProduct} onClose={() => setStockProduct(null)} onSave={fetchProducts} />}
      {editCategory !== undefined && <CategoryModal category={editCategory} onClose={() => setEditCategory(undefined)} onSave={fetchCategories} />}
      {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
}