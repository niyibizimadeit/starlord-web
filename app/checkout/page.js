'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

const DELIVERY_FEE = 2000;

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [createAccount, setCreateAccount] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'mtn',
  });

  useEffect(() => {
    if (cart.length === 0 && !order) router.push('/');
  }, [cart, order, router]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Smart payment pre-selection based on phone prefix
    if (key === 'phone') {
      const clean = value.replace(/\s/g, '');
      if (clean.startsWith('078') || clean.startsWith('079')) {
        setForm(prev => ({ ...prev, phone: value, paymentMethod: 'mtn' }));
      } else if (clean.startsWith('072') || clean.startsWith('073')) {
        setForm(prev => ({ ...prev, phone: value, paymentMethod: 'airtel' }));
      }
    }
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
          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
          customer: {
            name:    form.name,
            phone:   form.phone,
            address: form.address,
          },
          paymentMethod:   form.paymentMethod,
          createAccount,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'STOCK_CONFLICT') {
          setError(data.error);
          setProcessing(false);
          // Send them back to cart so they can review
          setTimeout(() => router.push('/cart'), 3000);
          return;
        }
        setError(data.error || 'Something went wrong. Please try again.');
        setProcessing(false);
        return;
      }

      // Order created — move to confirmation
      setOrder(data);
      clearCart();
      setStep(3);

    } catch {
      setError('Connection error. Please check your internet and try again.');
      setProcessing(false);
    }
  };

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
            padding: '12px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text)', fontSize: 14 }}>
              {item.name} x{item.qty}
            </span>
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
            <span style={{ color: 'var(--text)', fontSize: 13 }}>{formatRWF(DELIVERY_FEE)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--gold)' }}>
              {formatRWF(cartTotal + DELIVERY_FEE)}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
          <Link href="/cart" style={{
            flex: 1, display: 'block', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '15px',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
          }}>
            Edit Cart
          </Link>
          <button
            onClick={() => setStep(2)}
            style={{
              flex: 2, background: 'var(--gold)', color: '#000',
              border: 'none', borderRadius: 12, padding: '15px',
              fontWeight: 800, fontSize: 15,
            }}
          >
            Continue
          </button>
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
      borderRadius: 10,
      padding: '13px 14px',
      color: 'var(--text)',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border 0.2s',
    });

    const labelStyle = {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 6,
      fontWeight: 700,
      letterSpacing: 0.5,
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
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jean Paul Habimana"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              style={inputStyle(form.name)}
            />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 0788 123 456"
              value={form.phone}
              onChange={e => updateForm('phone', e.target.value)}
              style={inputStyle(form.phone)}
            />
          </div>

          <div>
            <label style={labelStyle}>Delivery Address</label>
            <input
              type="text"
              placeholder="e.g. Kicukiro, near Kigali Arena"
              value={form.address}
              onChange={e => updateForm('address', e.target.value)}
              style={inputStyle(form.address)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label style={labelStyle}>Pay With</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'mtn',    label: 'MTN MoMo',     sub: '078 / 079' },
                { key: 'airtel', label: 'Airtel Money',  sub: '072 / 073' },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => updateForm('paymentMethod', p.key)}
                  style={{
                    flex: 1,
                    background: form.paymentMethod === p.key ? 'var(--surface-2)' : 'var(--surface)',
                    border: `2px solid ${form.paymentMethod === p.key ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '14px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: form.paymentMethod === p.key ? 'var(--gold)' : 'var(--text-muted)',
                  }}>
                    {p.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save account checkbox */}
          <div
            onClick={() => setCreateAccount(!createAccount)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              padding: '12px 14px',
              background: 'var(--surface)',
              border: `1px solid ${createAccount ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 10,
            }}
          >
            <div style={{
              width: 18, height: 18,
              border: `2px solid ${createAccount ? 'var(--gold)' : 'var(--text-faint)'}`,
              borderRadius: 4,
              background: createAccount ? 'var(--gold)' : 'transparent',
              flexShrink: 0,
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {createAccount && (
                <span style={{ color: '#000', fontSize: 11, fontWeight: 800 }}>✓</span>
              )}
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

          {/* Error */}
          {error && (
            <div style={{
              background: '#2e1a1a',
              border: '1px solid var(--red)',
              borderRadius: 10,
              padding: '12px 14px',
              color: 'var(--red)',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Total reminder */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total to pay</span>
            <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 15 }}>
              {formatRWF(cartTotal + DELIVERY_FEE)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '15px',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Back
            </button>
            <button
              onClick={() => { if (validateStep1()) handleSubmit(); }}
              disabled={processing}
              style={{
                flex: 2,
                background: processing ? 'var(--gold-dark)' : 'var(--gold)',
                color: '#000',
                border: 'none',
                borderRadius: 12,
                padding: '15px',
                fontWeight: 800,
                fontSize: 15,
                opacity: processing ? 0.8 : 1,
              }}
            >
              {processing ? 'Placing order...' : `Pay ${formatRWF(cartTotal + DELIVERY_FEE)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3 — Confirmation ─────────────────────────────────────────
  if (step === 3 && order) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        padding: '60px 24px',
        textAlign: 'center',
      }}>
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
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
            Order Reference
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--gold)',
            letterSpacing: 2,
          }}>
            {order.reference}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            Save this reference to track your order
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href={`/track?ref=${order.reference}&phone=${form.phone}`}
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
            }}
          >
            Track Order
          </Link>
          <Link
            href="/"
            style={{
              display: 'block',
              background: 'var(--gold)',
              borderRadius: 12,
              padding: '14px',
              fontWeight: 800,
              fontSize: 14,
              color: '#000',
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

