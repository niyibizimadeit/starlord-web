'use client';

import { useState } from 'react';
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
  pending:        'var(--text-muted)',
  confirmed:      'var(--gold)',
  preparing:      'var(--gold)',
  dispatched:     '#6ab0f5',
  delivered:      'var(--green)',
  cancelled:      'var(--red)',
  stock_conflict: 'var(--red)',
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
        body: JSON.stringify({ fullName: form.full_name, email: form.email }),
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
          type="tel" value={form.phone}
          disabled
          style={{ ...inputStyle(form.phone), opacity: 0.6, cursor: 'not-allowed' }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
          Phone number cannot be changed
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} style={{
        background: loading ? 'var(--gold-dark)' : 'var(--gold)',
        color: '#000', border: 'none', borderRadius: 12,
        padding: '14px', fontWeight: 800, fontSize: 14,
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Addresses Tab ─────────────────────────────────────────────────────────────
function AddressesTab({ addresses: initialAddresses }) {
  const [addresses, setAddresses]   = useState(initialAddresses);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ label: '', address_line: '' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

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
          background: 'var(--surface)', border: `1px solid ${addr.is_default ? 'var(--gold)' : 'var(--border)'}`,
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
          fontWeight: 700, cursor: 'pointer',
          width: '100%',
        }}>
          + Add New Address
        </button>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded]   = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnSent, setReturnSent] = useState(false);
  const [returnError, setReturnError] = useState('');

  const handleReturn = async () => {
    setReturnError('');
    setReturning(true);
    try {
      const res = await fetch('/api/account/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, note: returnNote }),
      });
      const data = await res.json();
      if (res.ok) setReturnSent(true);
      else setReturnError(data.error || 'Failed to submit return request');
    } catch { setReturnError('Connection error. Try again.'); }
    setReturning(false);
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
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
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          {/* Items */}
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

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={'/track?ref=' + order.reference} style={{
              flex: 1, display: 'block', textAlign: 'center',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px',
              fontSize: 13, fontWeight: 700, color: 'var(--text)',
            }}>Track Order</Link>

            {order.status === 'delivered' && !returnSent && (
              <button onClick={() => setReturning(r => !r)} style={{
                flex: 1, background: 'none',
                border: '1px solid var(--red)',
                borderRadius: 10, padding: '10px',
                fontSize: 13, fontWeight: 700,
                color: 'var(--red)', cursor: 'pointer',
              }}>Request Return</button>
            )}

            {returnSent && (
              <div style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 12, color: '#4caf7d', fontWeight: 700,
              }}>✓ Return requested</div>
            )}
          </div>

          {/* Return form */}
          {returning && !returnSent && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                placeholder="Tell us why you want to return this order..."
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
                rows={3}
                style={{
                  width: '100%', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  padding: '12px 14px', color: 'var(--text)',
                  fontSize: 13, resize: 'none', boxSizing: 'border-box',
                }}
              />
              {returnError && <ErrorBox msg={returnError} />}
              <button onClick={handleReturn} style={{
                background: 'var(--red)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}>
                Submit Return Request
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        borderRadius: 12, padding: '14px 16px', marginBottom: 4,
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
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Saving...' : hasPassword ? 'Change Password' : 'Set Password'}
      </button>
    </div>
  );
}

// ── Main AccountClient ────────────────────────────────────────────────────────
export default function AccountClient({ profile, orders, addresses, authEmail }) {
  const router = useRouter();
  const [tab, setTab]           = useState('orders');
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