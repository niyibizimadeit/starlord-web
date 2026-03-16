import Link from 'next/link';

export const metadata = {
  title: 'Returns & Exchanges — STARLORD GROUP',
  description: 'Our return and exchange policy for STARLORD GROUP orders.',
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
            'Return window: 6 hours from delivery confirmation',
            'Replacements only — no cash refunds',
            'Customer is responsible for return delivery costs',
            'Item must be unused and in original packaging',
            'Request returns directly from your account order history',
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

        {/* Return window */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          borderRadius: 16,
          padding: '20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            6-Hour Return Window
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
            You have <strong style={{ color: 'var(--gold)' }}>6 hours from the moment your order is marked as delivered</strong> to
            submit a return request. After this window has passed, returns will not be accepted.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            To request a return, go to <strong style={{ color: 'var(--text)' }}>My Account → Orders</strong>,
            expand the delivered order, and click <strong style={{ color: 'var(--text)' }}>Request Return</strong>.
          </p>
        </div>

        {/* Customer responsibilities */}
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
            Customer Responsibilities
          </div>
          {[
            { title: 'Return delivery costs', body: 'The customer is responsible for all costs associated with returning the item to us. We do not cover return shipping fees.' },
            { title: 'Replacement only', body: 'Approved returns will receive a replacement product of the same item. We do not offer cash refunds under any circumstances.' },
            { title: 'Original condition', body: 'Returned items must be unused, in original packaging, and in the same condition as received. Items showing signs of use will not be accepted.' },
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
            When We Accept Returns
          </div>
          {[
            { title: 'Damaged or defective item', body: 'If your item arrived damaged or has a manufacturing defect, submit a return request within 6 hours of delivery.' },
            { title: 'Wrong item received', body: 'If we sent you the wrong product, submit a return request and we will replace it.' },
            { title: 'Size or fit issue', body: 'If the item does not fit as expected, you may return it within the 6-hour window. Item must be unused and in original packaging.' },
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
            We Cannot Accept Returns If
          </div>
          {[
            'More than 6 hours have passed since delivery confirmation',
            'The item has been used or shows signs of wear',
            'Original packaging has been discarded',
            'The item was purchased during a final sale or clearance',
            'The return request was not submitted through your account',
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
            How to Request a Return
          </div>
          {[
            'Go to My Account → Orders tab within 6 hours of delivery',
            'Expand the delivered order and click "Request Return"',
            'Enter your reason and agree to the return terms',
            'Select a preferred pickup time slot (optional)',
            'Submit — our team will contact you to confirm collection',
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

        {/* Account CTA */}
        <Link href="/account" style={{
          display: 'block',
          background: 'var(--gold)',
          borderRadius: 14,
          padding: '16px',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 15,
          color: '#000',
          textDecoration: 'none',
        }}>
          Go to My Account → Request Return
        </Link>

        {/* WhatsApp fallback */}
        <Link
          href="https://wa.me/250788678590?text=Hi%20STARLORD%20GROUP%2C%20I%20would%20like%20to%20request%20a%20return%20for%20my%20order."
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
          Need help? Contact us on WhatsApp
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