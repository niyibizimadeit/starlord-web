'use client';

import { useState, useRef } from 'react';

export const ADMIN_SECRET = 'starlord2024admin';
const SITE_URL = 'https://starlordweb2-y9jldvw8c-niyibizimadeits-projects.vercel.app';

export function formatRWF(n)  { return `RWF ${Number(n || 0).toLocaleString()}`; }
export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
export function toSlug(str) { return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }

export const STATUS_COLOR = {
  pending: '#C9A84C', confirmed: '#4caf7d', preparing: '#3498DB',
  dispatched: '#9B59B6', delivered: '#4caf7d', cancelled: '#e05555', stock_conflict: '#e05555',
};
export const NEXT_STATUS = { pending: 'confirmed', confirmed: 'preparing', preparing: 'dispatched', dispatched: 'delivered' };
export const LOG_ICONS = { ORDER_STATUS_CHANGED: '↺', PRODUCT_CREATED: '+', PRODUCT_UPDATED: '✎', PRODUCT_DELETED: '✕', STOCK_ADJUSTED: '▲', CATEGORY_CREATED: '+', CATEGORY_UPDATED: '✎', CATEGORY_DELETED: '✕', SETTINGS_UPDATED: '⚙' };

export const S = {
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
  modal:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px' },
  modalBox:  { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 720, padding: 28 },
};

export async function apiFetch(type, params = {}) {
  const qs  = new URLSearchParams({ secret: ADMIN_SECRET, type, ...params });
  const res = await fetch(`/api/admin/dashboard?${qs}`);
  return res.json();
}
export async function apiMutate(method, body) {
  const res = await fetch(`/api/admin/dashboard?secret=${ADMIN_SECRET}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

export function downloadCSV(rows, filename) {
  const csv  = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function printRevenueReport(data, period) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>STARLORD Revenue Report</title>
  <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;}h1{font-size:28px;color:#C9A84C;letter-spacing:4px;margin:0 0 4px;}.sub{font-size:12px;color:#888;margin:0 0 30px;letter-spacing:2px;}.grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin:24px 0;}.stat{border:1px solid #ddd;border-radius:8px;padding:16px;}.stat-val{font-size:20px;font-weight:800;color:#C9A84C;}.stat-lbl{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-top:4px;}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px;}th{background:#f5f5f5;padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #ddd;}td{padding:10px 12px;border-bottom:1px solid #eee;}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:11px;color:#aaa;}@media print{button{display:none;}}</style></head><body>
  <h1>STARLORD GROUP</h1><p class="sub">CHIC Building Ground Floor, Nyarugenge, Kigali · +250 788 678 590</p>
  <div style="font-size:16px;font-weight:bold;margin-bottom:20px;">Revenue Report — ${period.toUpperCase()}</div>
  <div class="grid">
    <div class="stat"><div class="stat-val">RWF ${Number(data.revenue||0).toLocaleString()}</div><div class="stat-lbl">Total Revenue</div></div>
    <div class="stat"><div class="stat-val">${data.paidOrders||0}</div><div class="stat-lbl">Paid Orders</div></div>
    <div class="stat"><div class="stat-val">RWF ${Number(data.avg||0).toLocaleString()}</div><div class="stat-lbl">Avg Order</div></div>
    <div class="stat"><div class="stat-val">${data.delivered||0}</div><div class="stat-lbl">Delivered</div></div>
  </div>
  <h3>Top Products</h3><table><thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th></tr></thead><tbody>
  ${(data.topProducts||[]).map((p,i)=>`<tr><td>${i+1}</td><td>${p.name}</td><td>${p.qty}</td><td>RWF ${Number(p.revenue).toLocaleString()}</td></tr>`).join('')}
  </tbody></table>
  <h3>Daily Revenue (Last 14 Days)</h3><table><thead><tr><th>Date</th><th>Revenue (RWF)</th></tr></thead><tbody>
  ${(data.dailyRevenue||[]).map(d=>`<tr><td>${d.date}</td><td>${Number(d.total).toLocaleString()}</td></tr>`).join('')}
  </tbody></table>
  <div class="footer">Generated ${new Date().toLocaleString('en-RW')} · STARLORD GROUP Admin Panel</div>
  <script>setTimeout(()=>window.print(),400);</script></body></html>`);
  w.document.close();
}

export function printShippingLabel(order) {
  const trackUrl = encodeURIComponent(`${SITE_URL}/track?ref=${order.reference}`);
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${trackUrl}`;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Label — ${order.reference}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:20px;}.label{border:2px solid #000;border-radius:8px;padding:20px;max-width:400px;margin:0 auto;}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:14px;}.brand{font-size:22px;font-weight:900;letter-spacing:3px;}.brand-sub{font-size:9px;letter-spacing:2px;color:#555;margin-top:2px;}.sec{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #ddd;}.sec-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:4px;}.sec-val{font-size:14px;font-weight:700;line-height:1.4;}.ref{font-size:20px;font-weight:900;letter-spacing:3px;font-family:monospace;}.footer{font-size:9px;color:#aaa;text-align:center;margin-top:10px;}@media print{button{display:none;}body{padding:0;}}</style>
  </head><body><div class="label">
  <div class="hdr"><div><div class="brand">STARLORD</div><div class="brand-sub">GROUP · KIGALI</div></div><img src="${qrUrl}" width="70" height="70" alt="QR"/></div>
  <div class="sec"><div class="sec-lbl">Order Reference</div><div class="ref">${order.reference}</div></div>
  <div class="sec"><div class="sec-lbl">Ship To</div><div class="sec-val">${order.customer_name}</div><div style="font-size:13px;color:#333;margin-top:3px;">${order.customer_phone}</div></div>
  <div class="sec"><div class="sec-lbl">Delivery Address</div><div style="font-size:13px;line-height:1.5;">${order.delivery_address}</div></div>
  <div class="sec" style="border:none;margin:0;padding:0;"><div class="sec-lbl">Date</div><div style="font-size:13px;">${new Date(order.created_at).toLocaleDateString('en-RW',{day:'2-digit',month:'short',year:'numeric'})}</div></div>
  <div class="footer">Scan QR to track · starlordgroup.rw</div>
  </div><script>setTimeout(()=>window.print(),500);</script></body></html>`);
  w.document.close();
}

export function StatCard({ label, value, sub, gold, alert }) {
  return (
    <div style={{ background: '#141414', border: `1px solid ${alert ? '#e05555' : gold ? '#C9A84C44' : '#2a2a2a'}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: alert ? '#e05555' : gold ? '#C9A84C' : '#fff', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function BarChart({ data, height = 100 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.total || d.value || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height, marginTop: 8 }}>
      {data.map((d, i) => {
        const val = d.total || d.value || 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div title={formatRWF(val)} style={{ width: '100%', background: val > 0 ? '#C9A84C' : '#1c1c1c', borderRadius: '3px 3px 0 0', height: `${Math.max((val / max) * (height - 18), val > 0 ? 4 : 0)}px`, transition: 'height 0.3s' }} />
            {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
              <div style={{ fontSize: 8, color: '#555', whiteSpace: 'nowrap' }}>{(d.date || d.label || '').slice(-5)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ImageUploader({ productId, images, onImagesChange }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    if (!productId) { setError('Save the product first before uploading images'); return; }
    setError(''); setUploading(true);
    const results = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file); form.append('productId', productId);
      const res  = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-secret': ADMIN_SECRET }, body: form });
      const data = await res.json();
      if (data.error) { setError(data.error); break; } else results.push(data.data);
    }
    setUploading(false);
    if (results.length > 0) onImagesChange([...images, ...results]);
  };

  const handleDelete = async (img) => {
    if (!confirm('Remove this image?')) return;
    const res  = await fetch('/api/admin/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ imageId: img.id, url: img.url }) });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    onImagesChange(images.filter(i => i.id !== img.id));
  };

  const handleMoveLeft = async (index) => {
    if (index === 0) return;
    const updated = [...images];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((img, i) => ({ ...img, sort_order: i }));
    onImagesChange(reordered);
    await fetch('/api/admin/upload', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }, body: JSON.stringify({ images: reordered.map(img => ({ id: img.id, sort_order: img.sort_order })) }) });
  };

  return (
    <div>
      <label style={S.label}>Product Images</label>
      {error && <div style={{ background: '#2e1a1a', border: '1px solid #e05555', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#e05555' }}>{error}</div>}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', width: 84, height: 84 }}>
              <img src={img.url} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #C9A84C' : '2px solid #2a2a2a' }} />
              {i === 0 && <div style={{ position: 'absolute', top: 3, left: 3, background: '#C9A84C', borderRadius: 3, fontSize: 8, fontWeight: 800, color: '#000', padding: '1px 4px' }}>MAIN</div>}
              <div style={{ position: 'absolute', top: 3, right: 3, display: 'flex', gap: 2 }}>
                {i > 0 && <button onClick={() => handleMoveLeft(i)} style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 3, color: '#fff', fontSize: 10, cursor: 'pointer', padding: '2px 5px' }}>←</button>}
                <button onClick={() => handleDelete(img)} style={{ background: 'rgba(200,0,0,0.8)', border: 'none', borderRadius: 3, color: '#fff', fontSize: 10, cursor: 'pointer', padding: '2px 5px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btn, background: '#1c1c1c', color: uploading ? '#555' : '#888', border: '1px solid #2a2a2a', opacity: uploading ? 0.6 : 1 }}>
        {uploading ? 'Uploading...' : '+ Upload Images'}
      </button>
      <div style={{ fontSize: 11, color: '#444', marginTop: 6 }}>JPG/PNG/WEBP · Max 2MB · First image is thumbnail · ← to reorder</div>
    </div>
  );
}

export function StockModal({ product, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('');
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const preview = Math.max(0, (product?.stock || 0) + parseInt(adjustment || 0));
  const handleSave = async () => {
    if (!adjustment || parseInt(adjustment) === 0) { alert('Enter a non-zero adjustment'); return; }
    setSaving(true);
    await apiMutate('PATCH', { type: 'stock_adjust', id: product.id, adjustment: parseInt(adjustment), reason });
    setSaving(false); await onSave(); onClose();
  };
  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>ADJUST STOCK</div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>
        <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{product.name}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Current: <span style={{ color: '#C9A84C', fontWeight: 700 }}>{product.stock}</span></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Adjustment (+ to add, − to remove)</label>
          <input style={S.input} type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="e.g. 10 or -3" autoFocus />
          {adjustment && <div style={{ fontSize: 12, color: preview === 0 ? '#e05555' : '#4caf7d', marginTop: 6 }}>New stock: <strong>{preview}</strong></div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Reason (optional)</label>
          <input style={S.input} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Restocked from supplier" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Confirm'}</button>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function CategoryModal({ category, onClose, onSave }) {
  const isNew = !category;
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form, setForm] = useState({
    name: category?.name || '', slug: category?.slug || '', description: category?.description || '',
    image_url: category?.image_url || '', sort_order: category?.sort_order !== undefined ? String(category.sort_order) : '0',
    is_active: category?.is_active ?? true,
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleNameChange = (val) => { f('name', val); if (isNew) f('slug', toSlug(val)); };
  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { setError('Name and slug are required'); return; }
    setError(''); setSaving(true);
    const result = isNew ? await apiMutate('POST', { type: 'category', ...form }) : await apiMutate('PATCH', { type: 'category', id: category.id, ...form });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    await onSave(); onClose();
  };
  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>{isNew ? 'NEW CATEGORY' : 'EDIT CATEGORY'}</div>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a', fontSize: 16, padding: '6px 12px' }}>✕</button>
        </div>
        {error && <div style={{ background: '#2e1a1a', border: '1px solid #e05555', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#e05555' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e => handleNameChange(e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Slug *</label>
            <input style={S.input} value={form.slug} onChange={e => f('slug', toSlug(e.target.value))} />
            <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>Lowercase, numbers and hyphens only.</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Description</label><input style={S.input} value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div><label style={S.label}>Sort Order</label><input style={S.input} type="number" value={form.sort_order} onChange={e => f('sort_order', e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <input type="checkbox" id="cat_active" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
            <label htmlFor="cat_active" style={{ fontSize: 13, color: '#888', cursor: 'pointer' }}>Active (visible)</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Image URL (optional)</label><input style={S.input} value={form.image_url} onChange={e => f('image_url', e.target.value)} placeholder="https://..." /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, background: saving ? '#555' : '#C9A84C', color: '#000', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : isNew ? 'Create' : 'Save'}</button>
          <button onClick={onClose} style={{ ...S.btn, background: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}