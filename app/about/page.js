import Link from 'next/link';

export const metadata = {
  title: 'About Us — STARLORD GROUP',
  description: 'Premium accessories store based in Kigali, Rwanda.',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 100 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
        borderRadius: 16,
        padding: '40px 24px 32px',
        position: 'relative',
        overflow: 'hidden',
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
          Our Story
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 10, lineHeight: 1.2,
        }}>
          About <span style={{ color: 'var(--gold)' }}>STARLORD</span>
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontSize: 14,
          lineHeight: 1.7, maxWidth: 340,
        }}>
          Premium accessories for people who care about the details.
        </p>
      </div>

      <div style={{ padding: '32px 24px 0' }}>

        {/* Story */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11, color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 700, marginBottom: 12,
          }}>
            Who We Are
          </div>
          <p style={{
            color: 'var(--text)', fontSize: 14,
            lineHeight: 1.8, marginBottom: 14,
          }}>
            STARLORD GROUP is a Kigali-based accessories brand built on a simple belief —
            that quality accessories should be accessible to everyone in Rwanda,
            without compromise on style or durability.
          </p>
          <p style={{
            color: 'var(--text-muted)', fontSize: 14,
            lineHeight: 1.8,
          }}>
            What started as a small physical store at the CHIC Building in Nyarugenge
            has grown into one of Kigali's go-to destinations for phone cases,
            tech accessories, and fashion items. Every product we carry is hand-picked
            for quality, style, and value.
          </p>
        </div>

        {/* Values */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11, color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 700, marginBottom: 16,
          }}>
            What We Stand For
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { title: 'Quality First', body: 'Every item in our catalogue goes through a quality check before it reaches you. We do not stock products we would not use ourselves.' },
              { title: 'Fast Delivery', body: 'We partner with trusted local couriers to get your order to you as quickly as possible anywhere in Kigali.' },
              { title: 'Easy Payments', body: 'Pay with MTN MoMo or Airtel Money — the way Rwandans actually pay. No complications.' },
              { title: 'Real Support', body: 'There is a real person behind every WhatsApp message. We are available every day from 9AM to 8PM.' },
            ].map(v => (
              <div key={v.title}>
                <div style={{
                  fontSize: 13, fontWeight: 800,
                  color: 'var(--text)', marginBottom: 4,
                }}>
                  {v.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {v.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11, color: 'var(--gold)',
            letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 700, marginBottom: 12,
          }}>
            Visit Our Store
          </div>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4, fontWeight: 700 }}>
            CHIC Building Ground Floor
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Nyarugenge, Kigali, Rwanda
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Open every day · 9:00 AM – 8:00 PM
          </div>
          <Link href="/contact" style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: '#000',
            borderRadius: 10,
            padding: '10px 20px',
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