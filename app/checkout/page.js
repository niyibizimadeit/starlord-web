'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep]               = useState(1);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState('');
  const [order, setOrder]             = useState(null);
  const [createAccount, setCreateAccount] = useState(false);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [addresses, setAddresses]     = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address_line: '' });
  const [savingAddress, setSavingAddress] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', paymentMethod: 'mtn',
  });

  useEffect(() => {
    if (cart.length === 0 && !order) router.push('/');
  }, [cart, order, router]);

  // ── Fetch session, profile, addresses + delivery fee ──────────────
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Delivery fee
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_fee')
      .single()
      .then(({ data }) => setDeliveryFee(data?.value ? Number(data.value) : 0));

    // Delivery slots
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_slots')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          try { setSlots(JSON.parse(data.value)); } catch {}
        }
      });

    // Session + prefill via API (bypasses RLS)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setIsLoggedIn(false); return; }
      setIsLoggedIn(true);

      // Use the existing profile API which uses service client
      const res = await fetch('/api/account/profile');
      if (!res.ok) return;
      const data = await res.json();

      const { profile, addresses: addrs } = data;

      // Prefill name + phone
      setForm(prev => ({
        ...prev,
        name:  profile?.fullName || prev.name,
        phone: profile?.phone    || prev.phone,
      }));

      // Set addresses
      if (addrs?.length) {
        setAddresses(addrs);
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setForm(prev => ({ ...prev, address: defaultAddr.address_line }));
      }
    });
  }, []);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'phone') {
      const clean = value.replace(/\s/g, '');
      if (clean.startsWith('078') || clean.startsWith('079')) {
        setForm(prev => ({ ...prev, phone: value, paymentMethod: 'mtn' }));
      } else if (clean.startsWith('072') || clean.startsWith('073')) {
        setForm(prev => ({ ...prev, phone: value, paymentMethod: 'airtel' }));
      }
    }
  };

  const handleAddressSelect = (addr) => {
    setSelectedAddressId(addr.id);
    setForm(prev => ({ ...prev, address: addr.address_line }));
  };
  const handleAddNewAddress = async () => {
    if (!newAddress.label || !newAddress.address_line) return;
    setSavingAddress(true);
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.addresses);
        const added = data.addresses[data.addresses.length - 1];
        setSelectedAddressId(added.id);
        setForm(prev => ({ ...prev, address: added.address_line }));
        setNewAddress({ label: '', address_line: '' });
        setShowAddressForm(false);
      }
    } catch {}
    setSavingAddress(false);
  };
  const validateStep1 = () => {
    if (!form.name.trim())    { setError('Please enter your full name'); return false; }
    if (!form.phone.trim())   { setError('Please enter your phone number'); return false; }
    if (!form.address.trim()) { setError('Please enter your delivery address'); return false; }
    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Rwandan phone number (078, 079, 072, or 073)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setProcessing(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.qty, variations: i.selectedVariations || null })),
          customer: { name: form.name, phone: form.phone, address: form.address },
          paymentMethod: form.paymentMethod,
          deliveryFee,
          deliverySlot: deliverySlot || null,
          createAccount,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'STOCK_CONFLICT') {
          setError(data.error);
          setProcessing(false);
          setTimeout(() => router.push('/cart'), 3000);
          return;
        }
        setError(data.error || 'Something went wrong. Please try again.');
        setProcessing(false);
        return;
      }
      setOrder(data);
      clearCart();
      setStep(3);
    } catch {
      setError('Connection error. Please check your internet and try again.');
      setProcessing(false);
    }
  };

  if (deliveryFee === null) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading checkout...</div>
      </div>
    );
  }

  // ── STEP 1 — Order Summary ────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 120px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
          Order Summary
        </h1>

        {cart.map(item => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text)', fontSize: 14 }}>{item.name} x{item.qty}</span>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>
              {formatRWF(item.price * item.qty)}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Subtotal</span>
            <span style={{ color: 'var(--text)', fontSize: 13 }}>{formatRWF(cartTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Delivery</span>
            <span style={{ color: 'var(--text)', fontSize: 13 }}>
              {deliveryFee === 0 ? 'Free' : formatRWF(deliveryFee)}
            </span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 12, borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--gold)' }}>
              {formatRWF(cartTotal + deliveryFee)}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
          <Link href="/cart" style={{
            flex: 1, display: 'block', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '15px',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
          }}>Edit Cart</Link>
          <button onClick={() => setStep(2)} style={{
            flex: 2, background: 'var(--gold)', color: '#000',
            border: 'none', borderRadius: 12, padding: '15px',
            fontWeight: 800, fontSize: 15,
          }}>Continue</button>
        </div>
      </div>
    );
  }

  // ── STEP 2 — Delivery Info + Payment ─────────────────────────────
  if (step === 2) {
    const inputStyle = (hasValue) => ({
      width: '100%',
      background: 'var(--surface)',
      border: `1px solid ${hasValue ? 'var(--gold)' : 'var(--border)'}`,
      borderRadius: 10, padding: '13px 14px',
      color: 'var(--text)', fontSize: 14,
      outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s',
    });

    const labelStyle = {
      display: 'block', fontSize: 12, color: 'var(--text-muted)',
      marginBottom: 6, fontWeight: 700, letterSpacing: 0.5,
    };

    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 120px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          Delivery Info
        </h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Step 2 of 2 — under 60 seconds
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" placeholder="e.g. Ntwali Franklin"
              value={form.name} onChange={e => updateForm('name', e.target.value)}
              style={inputStyle(form.name)}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel" placeholder="e.g. 0788 123 456"
              value={form.phone} onChange={e => updateForm('phone', e.target.value)}
              style={inputStyle(form.phone)}
            />
          </div>

          {/* Address — selector if logged in with addresses, else text input */}
          {/* Address */}
          <div>
            <label style={labelStyle}>Delivery Address</label>

            {isLoggedIn && addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Dropdown selector */}
                <select
                  value={selectedAddressId || ''}
                  onChange={e => {
                    const addr = addresses.find(a => a.id === e.target.value);
                    if (addr) handleAddressSelect(addr);
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--gold)',
                    borderRadius: 10, padding: '13px 14px',
                    color: 'var(--text)', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} — {addr.address_line}
                    </option>
                  ))}
                </select>

                {/* Add new address inline */}
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    style={{
                      background: 'none', border: '1px dashed var(--border)',
                      borderRadius: 10, padding: '10px',
                      color: 'var(--text-muted)', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    + Add new address
                  </button>
                ) : (
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--gold)',
                    borderRadius: 10, padding: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <input
                      type="text" placeholder="Label (e.g. Home, Work)"
                      value={newAddress.label}
                      onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))}
                      style={inputStyle(newAddress.label)}
                    />
                    <input
                      type="text" placeholder="e.g. Kimironko, near Kimironko Market"
                      value={newAddress.address_line}
                      onChange={e => setNewAddress(p => ({ ...p, address_line: e.target.value }))}
                      style={inputStyle(newAddress.address_line)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setShowAddressForm(false); setNewAddress({ label: '', address_line: '' }); }}
                        style={{
                          flex: 1, background: 'none', border: '1px solid var(--border)',
                          borderRadius: 8, padding: '10px', color: 'var(--text-muted)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >Cancel</button>
                      <button
                        onClick={handleAddNewAddress}
                        disabled={savingAddress || !newAddress.label || !newAddress.address_line}
                        style={{
                          flex: 2, background: 'var(--gold)', border: 'none',
                          borderRadius: 8, padding: '10px', color: '#000',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        }}
                      >
                        {savingAddress ? 'Saving...' : 'Save & Use'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Guest or no saved addresses — plain text input
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text" placeholder="e.g. Kimironko, near Kimironko Market"
                  value={form.address} onChange={e => updateForm('address', e.target.value)}
                  style={inputStyle(form.address)}
                />
                {isLoggedIn && !showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    style={{
                      background: 'none', border: '1px dashed var(--border)',
                      borderRadius: 10, padding: '10px',
                      color: 'var(--text-muted)', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    + Save this address to your account
                  </button>
                )}
                {isLoggedIn && showAddressForm && (
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--gold)',
                    borderRadius: 10, padding: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <input
                      type="text" placeholder="Label (e.g. Home, Work)"
                      value={newAddress.label}
                      onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))}
                      style={inputStyle(newAddress.label)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        style={{
                          flex: 1, background: 'none', border: '1px solid var(--border)',
                          borderRadius: 8, padding: '10px', color: 'var(--text-muted)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >Cancel</button>
                      <button
                        onClick={async () => {
                          if (!newAddress.label || !form.address) return;
                          setSavingAddress(true);
                          try {
                            await fetch('/api/account/addresses', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ label: newAddress.label, address_line: form.address }),
                            });
                            setShowAddressForm(false);
                          } catch {}
                          setSavingAddress(false);
                        }}
                        disabled={savingAddress}
                        style={{
                          flex: 2, background: 'var(--gold)', border: 'none',
                          borderRadius: 8, padding: '10px', color: '#000',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        }}
                      >
                        {savingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
             {/* Delivery Slot — optional */}
             {slots.length > 0 && (
            <div>
              <label style={labelStyle}>
                Delivery Time{' '}
                <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setDeliverySlot(deliverySlot === slot ? '' : slot)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: `2px solid ${deliverySlot === slot ? 'var(--gold)' : 'var(--border)'}`,
                      background: deliverySlot === slot ? 'var(--surface-2)' : 'var(--surface)',
                      color: deliverySlot === slot ? 'var(--gold)' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {slot}
                  </button>
                ))}
                {/* Any time option */}
                <button
                  onClick={() => setDeliverySlot(deliverySlot === 'Any time' ? '' : 'Any time')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: `2px solid ${deliverySlot === 'Any time' ? 'var(--gold)' : 'var(--border)'}`,
                    background: deliverySlot === 'Any time' ? 'var(--surface-2)' : 'var(--surface)',
                    color: deliverySlot === 'Any time' ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Any time
                </button>
              </div>
              {deliverySlot && (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                  ✓ Preferred: {deliverySlot} — we will do our best to deliver in this window
                </div>
              )}
            </div>
          )}
          {/* Payment Method */}
          <div>
            <label style={labelStyle}>Pay With</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'mtn',    label: 'MTN MoMo',    sub: '078 / 079' },
                { key: 'airtel', label: 'Airtel Money', sub: '072 / 073' },
              ].map(p => (
                <button key={p.key} onClick={() => updateForm('paymentMethod', p.key)} style={{
                  flex: 1,
                  background: form.paymentMethod === p.key ? 'var(--surface-2)' : 'var(--surface)',
                  border: `2px solid ${form.paymentMethod === p.key ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '14px 10px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4, transition: 'all 0.2s',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: form.paymentMethod === p.key ? 'var(--gold)' : 'var(--text-muted)',
                  }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save account checkbox — hidden for logged-in users */}
          {!isLoggedIn && (
            <div onClick={() => setCreateAccount(!createAccount)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: '12px 14px', background: 'var(--surface)',
              border: `1px solid ${createAccount ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 10,
            }}>
              <div style={{
                width: 18, height: 18,
                border: `2px solid ${createAccount ? 'var(--gold)' : 'var(--text-faint)'}`,
                borderRadius: 4, background: createAccount ? 'var(--gold)' : 'transparent',
                flexShrink: 0, marginTop: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {createAccount && <span style={{ color: '#000', fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                  Save my info for next time
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  We will create a free account so you can track orders and reorder faster.
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#2e1a1a', border: '1px solid var(--red)',
              borderRadius: 10, padding: '12px 14px',
              color: 'var(--red)', fontSize: 13,
            }}>{error}</div>
          )}

          {/* Total reminder */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 10,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total to pay</span>
            <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 15 }}>
              {formatRWF(cartTotal + deliveryFee)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, background: 'var(--surface)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 12,
              padding: '15px', fontWeight: 700, fontSize: 14,
            }}>Back</button>
            <button
              onClick={() => { if (validateStep1()) handleSubmit(); }}
              disabled={processing}
              style={{
                flex: 2, background: processing ? 'var(--gold-dark)' : 'var(--gold)',
                color: '#000', border: 'none', borderRadius: 12,
                padding: '15px', fontWeight: 800, fontSize: 15,
                opacity: processing ? 0.8 : 1,
              }}
            >
              {processing ? 'Placing order...' : `Pay ${formatRWF(cartTotal + deliveryFee)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3 — Confirmation ─────────────────────────────────────────
  if (step === 3 && order) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 800, marginBottom: 16 }}>
          Order Confirmed
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Thank you, {form.name.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          Your order is being prepared. Our courier will contact you at {form.phone}.
        </p>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, marginBottom: 32,
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Order Reference</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 22,
            fontWeight: 800, color: 'var(--gold)', letterSpacing: 2,
          }}>{order.reference}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            Save this reference to track your order
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={'/track?ref=' + order.reference + '&phone=' + form.phone} style={{
            display: 'block', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 12,
            padding: '14px', fontWeight: 700, fontSize: 14, color: 'var(--text)',
          }}>Track Order</Link>
          <Link href="/" style={{
            display: 'block', background: 'var(--gold)',
            borderRadius: 12, padding: '14px',
            fontWeight: 800, fontSize: 14, color: '#000',
          }}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return null;
}