'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      category: 'Orders & Delivery',
      items: [
        {
          q: 'How long does delivery take?',
          a: 'Most orders within Kigali are delivered within 2-3 hours depending on when you order. Our courier will contact you on the phone number you provided at checkout.',
        },
        {
          q: 'How much does delivery cost?',
          a: 'Delivery within Kigali is free for orders over 10,000 RWF, For orders under 10,000 RWF, a flat delivery fee of 1,000 RWF applies.',
        },
        {
          q: 'Do you deliver outside Kigali?',
          a: 'Yes, we deliver to other cities in Rwanda and the fee depends on how far it is from kigali. Delivery times may vary based on location, but we aim to deliver on the same day.',
        },
        {
          q: 'Can I track my order?',
          a: 'Yes. Use the Track Order page and enter your order reference and phone number to see your order status in real time.',
        },
        {
          q: 'What if I miss the courier?',
          a: 'Our courier will call you before arrival. If you miss the call, contact us on WhatsApp at +250788678590 and we will reschedule.',
        },
      ],
    },
    {
      category: 'Payments',
      items: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept MTN Mobile Money and Airtel Money. Payment is processed securely at checkout before your order is confirmed.',
        },
        {
          q: 'Is it safe to pay online?',
          a: 'Yes. Payments are processed through a secure payment gateway. We never store your payment details.',
        },
        {
          q: 'What happens if my payment fails?',
          a: 'If your payment fails, your order will not be confirmed and you will not be charged. You can try again with a different number or contact us on WhatsApp for help.',
        },
        {
          q: 'Can I pay on delivery?',
          a: 'Currently we require payment at checkout. This ensures your order is confirmed and reserved before the courier is dispatched.',
        },
      ],
    },
    {
      category: 'Products',
      items: [
        {
          q: 'Are your products original?',
          a: 'Yes. We hand-pick every product in our catalogue and only stock items that meet our quality standards.',
        },
        {
          q: 'What phone case brands do you carry?',
          a: 'We carry cases for iPhone for now but we will be expanding our stock soon. If you cannot find your model, contact us on WhatsApp and we will check stock.',
        },
        {
          q: 'Do you do custom orders?',
          a: 'For bulk or custom orders, contact us directly on WhatsApp at +250788678590 and our team will assist you.',
        },
        {
          q: 'An item I want is out of stock. What can I do?',
          a: 'Contact us on WhatsApp with the product name and we will let you know when it is back in stock or suggest a similar alternative.',
        },
      ],
    },
    {
      category: 'Returns & Exchanges',
      items: [
        {
          q: 'What is your return policy?',
          a: 'We do not accept returns but we do offer exchanges. If you received a damaged, defective, or wrong item, contact us within 48 hours of delivery and we will sort it out.',
        },
        {
          q: 'How do I request an exchange?',
          a: 'Contact us on WhatsApp at +250788678590 with your order reference and a photo of the issue. Our team will arrange the exchange as quickly as possible.',
        },
        {
          q: 'What if I ordered the wrong size?',
          a: 'We accept exchanges for size or fit issues as long as the item is unused and in its original packaging. Contact us within 48 hours of delivery.',
        },
      ],
    },
    {
      category: 'Account',
      items: [
        {
          q: 'Do I need an account to order?',
          a: 'No. You can checkout as a guest without creating an account. If you want to track orders and reorder faster, you can create a free account at checkout by ticking the "Save my info" checkbox.',
        },
        {
          q: 'How do I log in?',
          a: 'We use phone number login. Enter your phone number, receive a one-time code via SMS, and you are in. No password needed.',
        },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 100 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
        borderRadius: 16,
        padding: '40px 24px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 11, color: 'var(--gold)',
          letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 10, fontFamily: 'monospace',
        }}>
          Help Center
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 10, lineHeight: 1.2,
        }}>
          Frequently Asked <span style={{ color: 'var(--gold)' }}>Questions</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
          Can not find your answer? Contact us on{' '}
          <Link
            href="https://wa.me/250788678590"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold)', fontWeight: 700 }}
          >
            WhatsApp
          </Link>.
        </p>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        {faqs.map(section => (
          <div key={section.category} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: 2, textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Still need help */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Still need help?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Our team is available every day from 9AM to 8PM.
          </div>
          <Link href="/contact" style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: '#000',
            borderRadius: 10,
            padding: '10px 24px',
            fontWeight: 800,
            fontSize: 13,
          }}>
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${open ? 'var(--gold)' : 'var(--border)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
          {q}
        </span>
        <span style={{
          color: 'var(--gold)', fontSize: 18, flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontWeight: 300,
        }}>
          +
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 14px',
          fontSize: 13, color: 'var(--text-muted)',
          lineHeight: 1.7, borderTop: '1px solid var(--border)',
          paddingTop: 12,
        }}>
          {a}
        </div>
      )}
    </div>
  );
}