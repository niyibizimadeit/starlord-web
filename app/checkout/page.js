'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', paymentMethod: 'mtn', paymentPhone: '',
  });

  // ── Track IremboPay script readiness ──────────────────────────────
  const iremboPayReadyRef = useRef(false);
  const iremboPayFailedRef = useRef(false);
  // Resolves once window.IremboPay is usable, rejects only after every
  // retry in the loading effect below has been exhausted. handleSubmit
  // awaits this instead of checking window.IremboPay once and giving up.
  const widgetLoadPromiseRef = useRef(null);
  // Surfaced to the UI so the waiting screen can show a warning when
  // the card form never appeared and the poll is the only hope.
  const [widgetLoadFailed, setWidgetLoadFailed] = useState(false);

  // ── Guards ─────────────────────────────────────────────────────────
  const submittingRef = useRef(false);  // prevents double-submit
  const initiatedRef  = useRef(false);  // prevents double-initiate

  // ── Load IremboPay inline widget script ───────────────────────────
  // The sandbox occasionally drops the connection for this script the
  // same way it drops the /notification long-poll — so a single
  // failed fetch retries with a short backoff instead of giving up
  // and leaving the customer with a payment method that can't load.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already loaded (e.g. from a previous hot-reload mount)
    if (window.IremboPay && typeof window.IremboPay.initiate === 'function') {
      iremboPayReadyRef.current = true;
      widgetLoadPromiseRef.current = Promise.resolve();
      return;
    }

    let cancelled = false;
    const widgetSrc = '/api/irembopay-widget';
    const MAX_LOAD_ATTEMPTS = 3;

    widgetLoadPromiseRef.current = new Promise((resolve, reject) => {
      let attempt = 0;

      function loadScript() {
        attempt += 1;

        const existing = document.getElementById('irembopay-widget');
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.id = 'irembopay-widget';
        // Cache-bust each retry so a failed attempt isn't served stale
        script.src = `${widgetSrc}?attempt=${attempt}`;
        script.async = true;

        script.onload = () => {
          if (cancelled) return;
          // onload only means the top-level script finished downloading
          // and running — this widget loads an async chunk internally
          // (the same one the webpack publicPath patch targets) and
          // only assigns window.IremboPay once that chunk resolves.
          // Poll briefly for the real thing instead of trusting onload.
          const POLL_INTERVAL_MS = 100;
          const POLL_TIMEOUT_MS = 10000;
          const startedAt = Date.now();

          function checkReady() {
            if (cancelled) return;
            if (window.IremboPay && typeof window.IremboPay.initiate === 'function') {
              iremboPayReadyRef.current = true;
              resolve();
              return;
            }
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
              reject(new Error('window.IremboPay.initiate never appeared after script load'));
              return;
            }
            setTimeout(checkReady, POLL_INTERVAL_MS);
          }

          checkReady();
        };

        script.onerror = () => {
          if (cancelled) return;
          console.error(
            `[IremboPay] Widget script failed to load (attempt ${attempt}/${MAX_LOAD_ATTEMPTS})`,
          );
          if (attempt < MAX_LOAD_ATTEMPTS) {
            setTimeout(() => { if (!cancelled) loadScript(); }, 1500 * attempt);
          } else {
            iremboPayFailedRef.current = true;
            console.error('[IremboPay] Widget script failed to load after', MAX_LOAD_ATTEMPTS, 'attempts');
            reject(new Error(`Widget script failed to load after ${MAX_LOAD_ATTEMPTS} attempts`));
          }
        };

        document.head.appendChild(script);
      }

      loadScript();
    });

    return () => { cancelled = true; };
  }, []);

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

      const res = await fetch('/api/account/profile');
      if (!res.ok) return;
      const data = await res.json();

      const { profile, addresses: addrs } = data;

      setForm(prev => ({
        ...prev,
        name:  profile?.fullName || prev.name,
        phone: profile?.phone    || prev.phone,
      }));

      if (addrs?.length) {
        setAddresses(addrs);
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setForm(prev => ({ ...prev, address: defaultAddr.address_line }));
      }
    });
  }, []);

  // ── Poll for payment status once on step 3 ────────────────────────
  // This runs for both mobile money and card. Card no longer depends
  // on the widget's own callback to learn the outcome — this poll is
  // the source of truth, since it reads the same order row the
  // webhook updates regardless of how the widget's connection behaved.
  useEffect(() => {
    if (step !== 3 || !order) return;
    if (paymentStatus === 'paid' || paymentStatus === 'failed' || paymentStatus === 'expired') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/payment-status?ref=${order.reference}&phone=${encodeURIComponent(form.phone)}`
        );
        const data = await res.json();
        if (data.paymentStatus === 'paid') {
          setPaymentStatus('paid');
          clearInterval(interval);
        } else if (data.paymentStatus === 'failed') {
          setPaymentStatus('failed');
          clearInterval(interval);
        } else if (data.expired) {
          setPaymentStatus('expired');
          clearInterval(interval);
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [step, order, form.phone, paymentStatus]);

  // ── Reset card-payment guards when a terminal state is reached ─────
  // So the customer can retry (back → cart → checkout) without the
  // double-initiate guard blocking a fresh attempt.
  useEffect(() => {
    if (paymentStatus === 'failed' || paymentStatus === 'expired') {
      initiatedRef.current = false;
    }
    // widgetLoadFailed state doesn't need resetting here — the step-3
    // render reads it ephemerally, and the component remounts on re-entry.
  }, [paymentStatus]);

  // ── updateForm — simple setter, no auto-detection ─────────────────
  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
    // Validate payment phone for mobile money methods
    if (form.paymentMethod === 'mtn') {
      if (!form.paymentPhone.trim()) {
        setError('Please enter the MTN MoMo number to charge');
        return false;
      }
      if (!/^(078|079)\d{7}$/.test(form.paymentPhone.replace(/\s/g, ''))) {
        setError('Please enter a valid MTN MoMo number (starts with 078 or 079)');
        return false;
      }
    }
    if (form.paymentMethod === 'airtel') {
      if (!form.paymentPhone.trim()) {
        setError('Please enter the Airtel Money number to charge');
        return false;
      }
      if (!/^(072|073)\d{7}$/.test(form.paymentPhone.replace(/\s/g, ''))) {
        setError('Please enter a valid Airtel Money number (starts with 072 or 073)');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    // Prevent double-submission (double-click, etc.)
    if (submittingRef.current) return;
    submittingRef.current = true;

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
          submittingRef.current = false;
          setTimeout(() => router.push('/cart'), 3000);
          return;
        }
        setError(data.error || 'Something went wrong. Please try again.');
        setProcessing(false);
        submittingRef.current = false;
        return;
      }
      // Initiate payment — use paymentPhone for mobile money, contact phone for card
      const paymentPhone = form.paymentMethod === 'card' ? form.phone : form.paymentPhone;
      const paymentRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:   data.orderId,
          reference: data.reference,
          amount:    data.total,
          phone:     paymentPhone,
          method:    form.paymentMethod,
        }),
      });

      if (!paymentRes.ok) {
        setError('Payment initiation failed. Your order is saved — contact support with reference: ' + data.reference);
        setProcessing(false);
        submittingRef.current = false;
        setOrder(data);
        setStep(3);
        return;
      }

      const paymentData = await paymentRes.json();

      if (paymentData.invoiceNumber) {
        // ── Card flow ────────────────────────────────────────────────
        // IMPORTANT: we do NOT clearCart()/setStep(3) here anymore.
        // Previously the code advanced to the "Processing your payment"
        // screen immediately and only *then* awaited the widget script
        // and called initiate(). Because the await gave React time to
        // commit that state change, the modal ended up opening (or
        // failing to) behind a screen that already looked like it was
        // done — so users never saw the widget, or saw it vanish
        // instantly into "Processing". We now wait for the widget to
        // load and successfully call initiate() FIRST, and only move to
        // the waiting screen once the modal has genuinely opened.

        // Guard against double-initiate (e.g. double-click, re-render)
        if (initiatedRef.current) {
          setProcessing(false);
          submittingRef.current = false;
          return;
        }

        const widgetPayload = {
          invoiceNumber: paymentData.invoiceNumber,
          publicKey: process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY,
          locale: 'en',
          callback: function (response) {
            console.log('[IremboPay] Callback fired:', JSON.stringify(response));
            if (response && response.status === 'PAID') {
              setPaymentStatus('paid');
            } else if (response && (response.status === 'FAILED' || response.status === 'CANCELLED')) {
              // Widget reported a definitive failure — trust it so the
              // customer isn't left waiting for the poll to time out.
              setPaymentStatus('failed');
            } else if (response && response.code) {
              console.error('[IremboPay] Widget error:', JSON.stringify(response));
              // Don't force a failed state here — the poll is the
              // source of truth. A widget-side error doesn't always
              // mean the payment failed server-side.
            }
          },
        };

        // Wait for the widget script rather than checking once and
        // giving up — a retry in progress can still finish in time.
        // Bounded at 8s so a customer isn't left staring at nothing
        // if the script is genuinely unreachable. We stay on step 2
        // (with the "Placing order..." button state) the whole time,
        // so if this fails the customer sees a real error, not a fake
        // "processing" screen.
        try {
          await Promise.race([
            widgetLoadPromiseRef.current || Promise.reject(new Error('widget loader never started')),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timed out waiting for widget script')), 8000)
            ),
          ]);
        } catch (waitErr) {
          console.error(
            '[IremboPay] Widget not available in time:',
            waitErr.message,
          );
          setError('The card payment form could not be loaded. Please try again, or use MTN MoMo or Airtel Money instead.');
          setProcessing(false);
          submittingRef.current = false;
          return;
        }

        console.log('[IremboPay] Calling initiate with invoice:', widgetPayload.invoiceNumber);
        try {
          window.IremboPay.initiate(widgetPayload);
        } catch (initErr) {
          console.error('[IremboPay] initiate() threw:', initErr);
          setError('Could not open the card payment form. Please try again, or use MTN MoMo or Airtel Money instead.');
          setProcessing(false);
          submittingRef.current = false;
          return;
        }

        // Only now that initiate() has actually been called without
        // throwing — meaning the modal has genuinely opened — do we
        // mark it as initiated, clear the cart, and move to the
        // waiting screen behind the modal.
        initiatedRef.current = true;
        setOrder(data);
        clearCart();
        setStep(3);
        setProcessing(false);
      } else {
        // Mobile money: show "Check your phone" waiting screen
        setOrder(data);
        clearCart();
        setStep(3);
        setProcessing(false);
      }
    } catch {
      setError('Connection error. Please check your internet and try again.');
      setProcessing(false);
      submittingRef.current = false;
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
            <label style={labelStyle}>Contact Phone Number</label>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>
              For delivery coordination — can be different from your payment number
            </div>
            <input
              type="tel" placeholder="e.g. 0788 123 456"
              value={form.phone} onChange={e => updateForm('phone', e.target.value)}
              style={inputStyle(form.phone)}
            />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Delivery Address</label>

            {isLoggedIn && addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                { key: 'mtn',    label: 'MTN MoMo',              sub: '078 / 079' },
                { key: 'airtel', label: 'Airtel Money',          sub: '072 / 073' },
                { key: 'card',   label: 'Card (Visa / Mastercard)', sub: 'Pay online' },
              ].map(p => {
                const isSelected = form.paymentMethod === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => updateForm('paymentMethod', p.key)}
                    style={{
                      flex: 1,
                      background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                      border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: 12, padding: '14px 10px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4, transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isSelected ? 'var(--gold)' : 'var(--text-muted)',
                    }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Payment Detail — based on selected method */}
          {form.paymentMethod === 'mtn' && (
            <div>
              <label style={labelStyle}>MoMo Phone Number</label>
              <input
                type="tel" placeholder="e.g. 0788 123 456"
                value={form.paymentPhone}
                onChange={e => updateForm('paymentPhone', e.target.value)}
                style={inputStyle(form.paymentPhone)}
              />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                The MTN MoMo number to charge (must start with 078 or 079)
              </div>
            </div>
          )}

          {form.paymentMethod === 'airtel' && (
            <div>
              <label style={labelStyle}>Airtel Money Phone Number</label>
              <input
                type="tel" placeholder="e.g. 0728 123 456"
                value={form.paymentPhone}
                onChange={e => updateForm('paymentPhone', e.target.value)}
                style={inputStyle(form.paymentPhone)}
              />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                The Airtel Money number to charge (must start with 072 or 073)
              </div>
            </div>
          )}

          {form.paymentMethod === 'card' && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                You will enter your card details securely on the next step via IremboPay.
              </div>
            </div>
          )}

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

  // ── STEP 3 — Payment Waiting / Confirmation ───────────────────────
  if (step === 3 && order) {

    // Paid ✓
    if (paymentStatus === 'paid') {
      return (
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 800, marginBottom: 16 }}>
            Payment Confirmed
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Thank you, {form.name.split(' ')[0]}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Your order is confirmed. Our courier will contact you at {form.phone}.
          </p>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20, marginBottom: 32,
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Order Reference</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 2 }}>
              {order.reference}
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

    // Failed or expired
    if (paymentStatus === 'failed' || paymentStatus === 'expired') {
      return (
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--red)', fontWeight: 800, marginBottom: 16 }}>
            {paymentStatus === 'expired' ? 'Payment Timed Out' : 'Payment Failed'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            {paymentStatus === 'expired'
              ? 'Your payment window expired'
              : 'Payment was not completed'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Your order has been cancelled and no stock was held. Please try again.
          </p>
          <Link href="/cart" style={{
            display: 'block', background: 'var(--gold)',
            borderRadius: 12, padding: '14px',
            fontWeight: 800, fontSize: 14, color: '#000',
          }}>Back to Cart</Link>
        </div>
      );
    }

    // Waiting (default)
    const isCardPayment = form.paymentMethod === 'card';
    const displayPhone = isCardPayment ? form.phone : form.paymentPhone;
    const providerName = form.paymentMethod === 'mtn' ? 'MTN MoMo' : form.paymentMethod === 'airtel' ? 'Airtel Money' : '';
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
          {isCardPayment ? 'Processing your payment' : 'Check your phone'}
        </h1>
        {isCardPayment ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              Your card payment is being processed securely via IremboPay.
            </p>
            {widgetLoadFailed && (
              <div style={{
                background: '#2e1a1a', border: '1px solid var(--red)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                color: 'var(--red)', fontSize: 13, lineHeight: 1.5,
              }}>
                The card payment form could not be loaded. This may be a temporary issue —
                please go back and try again, or use MTN MoMo or Airtel Money instead.
              </div>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
            A payment prompt has been sent to <strong style={{ color: 'var(--text)' }}>{displayPhone}</strong>.
            Enter your {providerName} PIN to confirm.
          </p>
        )}
        <p style={{ color: 'var(--text-faint)', fontSize: 12, marginBottom: 32 }}>
          This page will update automatically. Do not close it.
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, marginBottom: 32,
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Order Reference</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: 2 }}>
            {order.reference}
          </div>
          <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 8 }}>
            Amount: {formatRWF(order.total)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--gold)', opacity: 0.3,
              animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  return null;
}