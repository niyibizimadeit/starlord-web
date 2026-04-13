'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const STATUS_COLORS = {
  pending:          'var(--text-muted)',
  confirmed:        'var(--gold)',
  preparing:        'var(--gold)',
  dispatched:       '#6ab0f5',
  delivered:        'var(--green)',
  cancelled:        'var(--red)',
  stock_conflict:   'var(--red)',
  return_requested: '#f5a623',
};

const inputStyle = (hasValue) => ({
  width: '100%',
  background: 'var(--surface)',
  border: `1px solid ${hasValue ? 'var(--gold)' : 'var(--border)'}`,
  borderRadius: 10, padding: '13px 14px',
  color: 'var(--text)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
});

const labelStyle = {
  display: 'block', fontSize: 12,
  color: 'var(--text-muted)', marginBottom: 6,
  fontWeight: 700, letterSpacing: 0.5,
};

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: '#2e1a1a', border: '1px solid var(--red)',
      borderRadius: 10, padding: '12px 14px',
      color: 'var(--red)', fontSize: 13, marginBottom: 16,
    }}>{msg}</div>
  );
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: '#1a2e1a', border: '1px solid #4caf7d',
      borderRadius: 10, padding: '12px 14px',
      color: '#4caf7d', fontSize: 13, marginBottom: 16,
    }}>{msg}</div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email:     profile?.email || '',
    phone:     profile?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.full_name, email: form.email, phone: form.phone }),
      });
      const data = await res.json();
      if (res.ok) setSuccess('Profile updated successfully!');
      else setError(data.error || 'Failed to update profile');
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SuccessBox msg={success} />
      <ErrorBox msg={error} />

      <div>
        <label style={labelStyle}>Full Name</label>
        <input
          type="text" value={form.full_name}
          onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
          style={inputStyle(form.full_name)}
        />
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          style={inputStyle(form.email)}
        />
      </div>

      <div>
        <label style={labelStyle}>Phone Number</label>
        <input
          type="tel"
          placeholder="e.g. 0788 123 456"
          value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          style={inputStyle(form.phone)}
        />
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
          Add your phone number for faster checkout
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} style={{
        background: loading ? 'var(--gold-dark)' : 'var(--gold)',
        color: '#000', border: 'none', borderRadius: 12,
        padding: '14px', fontWeight: 800, fontSize: 14,
        opacity: loading ? 0.7 : 1, cursor: 'pointer',
      }}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Addresses Tab ─────────────────────────────────────────────────────────────
function AddressesTab({ addresses: initialAddresses }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({ label: '', address_line: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const resetForm = () => {
    setForm({ label: '', address_line: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (!form.label || !form.address_line) {
      setError('Label and address are required'); return;
    }
    setLoading(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch('/api/account/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.addresses);
        setSuccess(editId ? 'Address updated!' : 'Address added!');
        resetForm();
      } else { setError(data.error || 'Failed to save address'); }
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) setAddresses(data.addresses);
    } catch {}
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true }),
      });
      const data = await res.json();
      if (res.ok) setAddresses(data.addresses);
    } catch {}
  };

  const startEdit = (addr) => {
    setForm({ label: addr.label, address_line: addr.address_line });
    setEditId(addr.id);
    setShowForm(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SuccessBox msg={success} />
      <ErrorBox msg={error} />

      {addresses.map(addr => (
        <div key={addr.id} style={{
          background: 'var(--surface)',
          border: `1px solid ${addr.is_default ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {addr.label}
                </span>
                {addr.is_default && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#000',
                    background: 'var(--gold)', padding: '2px 8px', borderRadius: 20,
                  }}>DEFAULT</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {addr.address_line}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!addr.is_default && (
                <button onClick={() => handleSetDefault(addr.id)} style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
                }}>Set default</button>
              )}
              <button onClick={() => startEdit(addr)} style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '5px 10px',
                fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
              }}>Edit</button>
              <button onClick={() => handleDelete(addr.id)} style={{
                background: 'none', border: '1px solid var(--red)',
                borderRadius: 8, padding: '5px 10px',
                fontSize: 11, color: 'var(--red)', cursor: 'pointer',
              }}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--gold)',
          borderRadius: 12, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <label style={labelStyle}>Label (e.g. Home, Work)</label>
            <input
              type="text" placeholder="Home"
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              style={inputStyle(form.label)}
            />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input
              type="text" placeholder="e.g. Kicukiro, near Kigali Arena"
              value={form.address_line}
              onChange={e => setForm(p => ({ ...p, address_line: e.target.value }))}
              style={inputStyle(form.address_line)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetForm} style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px', fontWeight: 700,
              fontSize: 13, color: 'var(--text)', cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 2, background: 'var(--gold)', border: 'none',
              borderRadius: 10, padding: '12px',
              fontWeight: 800, fontSize: 13, color: '#000', cursor: 'pointer',
            }}>
              {loading ? 'Saving...' : editId ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          background: 'none', border: '2px dashed var(--border)',
          borderRadius: 12, padding: '14px',
          color: 'var(--text-muted)', fontSize: 13,
          fontWeight: 700, cursor: 'pointer', width: '100%',
        }}>
          + Add New Address
        </button>
      )}
    </div>
  );
}

// ── Return Form ───────────────────────────────────────────────────────────────
function ReturnForm({ onSubmit, onCancel, error }) {
  const [note, setNote]             = useState('');
  const [slot, setSlot]             = useState('');
  const [agreed, setAgreed]         = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const RETURN_SLOTS = ['Morning 9:00 AM - 12:00 PM', 'Afternoon 12:10 PM - 5:00 PM'];

  const handleSubmit = async () => {
    if (!agreed || !note.trim()) return;
    setSubmitting(true);
    await onSubmit(note, slot);
    setSubmitting(false);
  };

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Reason */}
      <div>
        <label style={labelStyle}>Reason for return</label>
        <textarea
          placeholder="Please describe why you want to return this order..."
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 14px', color: 'var(--text)',
            fontSize: 13, resize: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Preferred pickup time */}
      <div>
        <label style={labelStyle}>
          Preferred pickup time{' '}
          <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RETURN_SLOTS.map(s => (
            <button key={s} onClick={() => setSlot(slot === s ? '' : s)} style={{
              padding: '8px 12px', borderRadius: 8,
              border: `2px solid ${slot === s ? 'var(--gold)' : 'var(--border)'}`,
              background: slot === s ? 'var(--surface-2)' : 'var(--surface)',
              color: slot === s ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Terms agreement */}
      <div
        onClick={() => setAgreed(!agreed)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          cursor: 'pointer', padding: '10px 12px',
          background: 'var(--surface)',
          border: `1px solid ${agreed ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: 10,
        }}
      >
        <div style={{
          width: 16, height: 16, flexShrink: 0, marginTop: 1,
          border: `2px solid ${agreed ? 'var(--gold)' : 'var(--text-faint)'}`,
          borderRadius: 4,
          background: agreed ? 'var(--gold)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {agreed && <span style={{ color: '#000', fontSize: 10, fontWeight: 800 }}>✓</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          I have read and agree to the{' '}
          <a href="/returns" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'underline' }}>return terms</a>
          . I understand I am responsible for return delivery costs and will receive a{' '}
          <strong style={{ color: 'var(--text)' }}>replacement product</strong>, not a refund.
          Return window is 6 hours from delivery confirmation.
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, background: 'none', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px', fontSize: 13,
          color: 'var(--text-muted)', cursor: 'pointer',
        }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !agreed || !note.trim()}
          style={{
            flex: 2,
            background: agreed && note.trim() ? 'var(--red)' : 'var(--surface)',
            color: agreed && note.trim() ? '#fff' : 'var(--text-faint)',
            border: 'none', borderRadius: 10, padding: '10px',
            fontWeight: 800, fontSize: 13,
            cursor: agreed && note.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Return Request'}
        </button>
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded]     = useState(false);
  const [returning, setReturning]   = useState(false);
  const [returnSent, setReturnSent] = useState(false);
  const [returnError, setReturnError] = useState('');

  const handleReturn = async (note, slot) => {
    setReturnError('');
    try {
      const res = await fetch('/api/account/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, note, returnSlot: slot }),
      });
      const data = await res.json();
      if (res.ok) {
        setReturnSent(true);
        setReturning(false);
      } else {
        setReturnError(data.error || 'Failed to submit return request');
      }
    } catch { setReturnError('Connection error. Try again.'); }
  };

  // Check 6-hour return window
  const canReturn = useMemo(() => {
    if (order.status !== 'delivered') return false;
    const deliveredAt = new Date(order.updated_at || order.created_at);
    const hoursElapsed = (new Date() - deliveredAt) / (1000 * 60 * 60);
    return hoursElapsed <= 6;
  }, [order.status, order.updated_at, order.created_at]);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>

      {/* Order Header */}
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '14px 16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
      }}>
        <div>
          <div style={{
            fontFamily: 'monospace', fontSize: 14,
            fontWeight: 800, color: 'var(--gold)', marginBottom: 4,
          }}>{order.reference}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {formatDate(order.created_at)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
            {formatRWF(order.total)}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: STATUS_COLORS[order.status] || 'var(--text-muted)',
            textTransform: 'capitalize',
            background: 'var(--surface-2)',
            padding: '3px 10px', borderRadius: 20,
          }}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>

          {/* Order Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {order.order_items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {item.products?.name || 'Product'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty {item.quantity}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>
                  {formatRWF(item.price_at_time * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery address */}
          {order.delivery_address && (
            <div style={{
              fontSize: 12, color: 'var(--text-muted)',
              marginBottom: 12, paddingTop: 8,
              borderTop: '1px solid var(--border)',
            }}>
              📍 {order.delivery_address}
            </div>
          )}

          {/* Delivery slot */}
          {order.delivery_slot && (
            <div style={{
              fontSize: 12, color: 'var(--text-muted)',
              marginBottom: 12,
            }}>
              🕐 Preferred delivery: {order.delivery_slot}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {order.status === 'delivered' ? (
              <Link href={`/products?review=true&orderId=${order.id}`} style={{
                flex: 1, display: 'block', textAlign: 'center',
                background: 'var(--gold)', border: 'none',
                borderRadius: 10, padding: '10px',
                fontSize: 13, fontWeight: 700, color: '#000',
              }}>Leave a Review</Link>
            ) : (
              <Link href={'/track?ref=' + order.reference} style={{
                flex: 1, display: 'block', textAlign: 'center',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px',
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
              }}>Track Order</Link>
            )}

            {order.status === 'delivered' && canReturn && !returnSent && (
              <button onClick={() => setReturning(r => !r)} style={{
                flex: 1, background: 'none',
                border: '1px solid var(--red)',
                borderRadius: 10, padding: '10px',
                fontSize: 13, fontWeight: 700,
                color: 'var(--red)', cursor: 'pointer',
              }}>Request Return</button>
            )}

            {order.status === 'delivered' && !canReturn && (
              <div style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 11, color: 'var(--text-faint)',
              }}>Return window expired</div>
            )}

          {(order.status === 'return_requested' || returnSent) && (
              <div style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 12, color: '#f5a623', fontWeight: 700,
              }}>⏳ Return pending review</div>
            )}

            {order.status === 'return_approved' && (
              <div style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 12, color: '#4caf7d', fontWeight: 700,
              }}>✓ Return approved</div>
            )}

            {order.status === 'return_rejected' && (
              <div style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 12, color: 'var(--red)', fontWeight: 700,
              }}>✕ Return rejected</div>
            )}
          </div>
          {/* Return Form */}
          {returning && !returnSent && (
            <ReturnForm
              onSubmit={handleReturn}
              onCancel={() => setReturning(false)}
              error={returnError}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab({ orders }) {
  if (orders.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          No orders yet
        </div>
        <Link href="/" style={{
          display: 'inline-block', background: 'var(--gold)',
          color: '#000', borderRadius: 10, padding: '10px 24px',
          fontWeight: 800, fontSize: 13,
        }}>Start Shopping</Link>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {orders.map(order => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({ profile }) {
  const hasPassword = profile?.password_set;
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSetPassword = async () => {
    setError(''); setSuccess('');
    if (!form.newPassword || form.newPassword.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/account/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? form.currentPassword : undefined,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(hasPassword ? 'Password changed successfully!' : 'Password set successfully!');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else { setError(data.error || 'Failed to set password'); }
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {hasPassword
            ? '✅ You have a password set. You can sign in with email + password.'
            : '⚠️ No password set. Set one to also sign in with your email.'}
        </div>
      </div>

      <SuccessBox msg={success} />
      <ErrorBox msg={error} />

      {hasPassword && (
        <div>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password" placeholder="Enter current password"
            value={form.currentPassword}
            onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
            style={inputStyle(form.currentPassword)}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>{hasPassword ? 'New Password' : 'Set Password'}</label>
        <input
          type="password" placeholder="At least 6 characters"
          value={form.newPassword}
          onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
          style={inputStyle(form.newPassword)}
        />
      </div>

      <div>
        <label style={labelStyle}>Confirm Password</label>
        <input
          type="password" placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          style={inputStyle(form.confirmPassword)}
        />
      </div>

      <button onClick={handleSetPassword} disabled={loading} style={{
        background: loading ? 'var(--gold-dark)' : 'var(--gold)',
        color: '#000', border: 'none', borderRadius: 12,
        padding: '14px', fontWeight: 800, fontSize: 14,
        opacity: loading ? 0.7 : 1, cursor: 'pointer',
      }}>
        {loading ? 'Saving...' : hasPassword ? 'Change Password' : 'Set Password'}
      </button>
    </div>
  );
}

// ── Main AccountClient ────────────────────────────────────────────────────────
export default function AccountClient({ profile, orders, addresses, authEmail }) {
  const router = useRouter();
  const [tab, setTab]               = useState('orders');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const TABS = [
    { key: 'orders',    label: 'Orders' },
    { key: 'profile',   label: 'Profile' },
    { key: 'addresses', label: 'Addresses' },
    { key: 'security',  label: 'Security' },
  ];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 100px' }}>

      {/* Profile Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
            MY ACCOUNT
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {profile?.full_name || 'Welcome back'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {authEmail || profile?.phone}
          </div>
        </div>
        <button onClick={handleLogout} disabled={loggingOut} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 10, padding: '8px 14px',
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--surface)', borderRadius: 12,
        padding: 4, border: '1px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '9px 4px',
            border: 'none', borderRadius: 9,
            background: tab === t.key ? 'var(--gold)' : 'transparent',
            color: tab === t.key ? '#000' : 'var(--text-muted)',
            fontWeight: 800, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'orders'    && <OrdersTab orders={orders} />}
      {tab === 'profile'   && <ProfileTab profile={profile} />}
      {tab === 'addresses' && <AddressesTab addresses={addresses} />}
      {tab === 'security'  && <SecurityTab profile={profile} />}
    </div>
  );
}