import Link from 'next/link';

export const metadata = {
  title: 'Returns & Exchanges — STARLORD GROUP',
  description: 'Our exchange policy for STARLORD GROUP orders.',
};

export default function ReturnsPage() {
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
          Our Policy
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 10, lineHeight: 1.2,
        }}>
          Returns &amp; <span style={{ color: 'var(--gold)' }}>Exchanges</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
          We want you to be happy with every purchase.
          If something is not right, we will make it right.
        </p>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Summary card */}
        <div style={{
          background: '#0d2e1a',
          border: '1px solid #1a5c33',
          borderRadius: 16,
          padding: '20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: '#4caf7d',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Quick Summary
          </div>
          {[
            'No returns — exchanges only',
            'Contact us within 48 hours of delivery',
            'Item must be unused and in original packaging',
            'We cover exchange delivery at no extra cost to you',
          ].map(point => (
            <div key={point} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              marginBottom: 8,
            }}>
              <span style={{ color: '#4caf7d', flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: '#d4f5e0', lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>

        {/* When we accept */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            When We Accept Exchanges
          </div>
          {[
            { title: 'Damaged or defective item', body: 'If your item arrived damaged or has a manufacturing defect, we will exchange it immediately at no cost.' },
            { title: 'Wrong item received', body: 'If we sent you the wrong product, we will exchange it and cover all delivery costs.' },
            { title: 'Size or fit issue', body: 'If the item does not fit as expected, we will exchange it for the correct size. Item must be unused and in original packaging.' },
          ].map(item => (
            <div key={item.title} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>

        {/* When we do not accept */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--red)',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            We Cannot Accept Exchanges If
          </div>
          {[
            'More than 48 hours have passed since delivery',
            'The item has been used or shows signs of wear',
            'Original packaging has been discarded',
            'The item was purchased during a final sale or clearance',
          ].map(point => (
            <div key={point} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              marginBottom: 8,
            }}>
              <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>✗</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>

        {/* How to request */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            How to Request an Exchange
          </div>
          {[
            'Contact us on WhatsApp at +250788678590 within 48 hours of delivery',
            'Send your order reference number and a photo clearly showing the issue',
            'Our team will confirm the exchange and arrange collection or drop-off',
            'Your replacement item will be dispatched within 24 hours of confirmation',
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              marginBottom: 14,
            }}>
              <div style={{
                width: 24, height: 24, flexShrink: 0,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: 'var(--gold)',
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, paddingTop: 2 }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="https://wa.me/250788678590?text=Hi%20STARLORD%20GROUP%2C%20I%20would%20like%20to%20request%20an%20exchange%20for%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            background: '#25d366',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 15,
            color: '#000',
            textDecoration: 'none',
          }}
        >
          Request an Exchange on WhatsApp
        </Link>

        <Link href="/contact" style={{
          display: 'block',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          padding: '4px',
        }}>
          View all contact options →
        </Link>

      </div>
    </div>
  );
}