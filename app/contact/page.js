'use client';

import Link from 'next/link';

const CONTACT = {
  whatsapp:    '+250788678590',
  phone:       '+250788678590',
  emails:      ['starlordgroup@gmail.com', 'info@starlordgroup.rw'],
  address:     'CHIC Building Ground Floor, Nyarugenge, Kigali, Rwanda',
  hours:       '9:00 AM – 8:00 PM, Every day',
  instagram:   'https://www.instagram.com/starlordgroup/',
};

function ContactCard({ icon, label, value, href, sub }) {
  const content = (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: 42, height: 42, flexShrink: 0,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--gold)', fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: href ? 'var(--gold)' : 'var(--text)',
          wordBreak: 'break-word',
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {href && (
        <div style={{
          fontSize: 18, color: 'var(--text-faint)',
          flexShrink: 0, alignSelf: 'center',
        }}>
          →
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        {content}
      </a>
    );
  }

  return content;
}

export default function ContactPage() {
  const whatsappMessage = encodeURIComponent('Hi STARLORD GROUP, I have a question about my order.');
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp.replace('+', '')}?text=${whatsappMessage}`;

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
          We are here for you
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 10, lineHeight: 1.2,
        }}>
          Contact <span style={{ color: 'var(--gold)' }}>STARLORD</span>
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontSize: 14,
          lineHeight: 1.6, maxWidth: 320,
        }}>
          Questions about an order? Want to know if we have something in stock?
          Reach us on WhatsApp for the fastest response.
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* WhatsApp — primary CTA */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textDecoration: 'none' }}
        >
          <div style={{
            background: '#0d2e1a',
            border: '1px solid #1a5c33',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#25d366'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1a5c33'}
          >
            <div style={{
              width: 42, height: 42, flexShrink: 0,
              background: '#25d366',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WhatsAppIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: '#4caf7d',
                letterSpacing: 1, textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                WhatsApp — Fastest Response
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {CONTACT.whatsapp}
              </div>
              <div style={{ fontSize: 12, color: '#4caf7d', marginTop: 2 }}>
                Tap to open WhatsApp chat
              </div>
            </div>
            <div style={{ fontSize: 18, color: '#4caf7d', flexShrink: 0 }}>→</div>
          </div>
        </a>

        {/* Phone */}
        <ContactCard
          icon={<PhoneIcon />}
          label="Phone"
          value={CONTACT.phone}
          href={`tel:${CONTACT.phone}`}
          sub="Call us directly"
        />

        {/* Email — two addresses */}
        <ContactCard
          icon={<EmailIcon />}
          label="Email"
          value={CONTACT.emails[0]}
          href={`mailto:${CONTACT.emails[0]}`}
          sub={CONTACT.emails[1]}
        />

        {/* Address */}
        <ContactCard
          icon={<LocationIcon />}
          label="Store Location"
          value={CONTACT.address}
          href={`https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}`}
          sub="Open in Google Maps"
        />

        {/* Hours */}
        <ContactCard
          icon={<ClockIcon />}
          label="Business Hours"
          value={CONTACT.hours}
          sub="Walk in any time during these hours"
        />

        {/* Instagram */}
        <ContactCard
          icon={<InstagramIcon />}
          label="Instagram"
          value="@starlordgroup"
          href={CONTACT.instagram}
          sub="Follow us for new arrivals"
        />
      </div>

      {/* Response time note */}
      <div style={{
        margin: '24px 20px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--text)', marginBottom: 4,
          }}>
            We typically reply within 30 minutes
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            WhatsApp is the fastest way to reach us.
            For order tracking you can also use the{' '}
            <Link href="/track" style={{ color: 'var(--gold)', fontWeight: 700 }}>
              Track Order
            </Link>{' '}
            page.
          </div>
        </div>
      </div>

    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.571a.5.5 0 0 0 .619.612l5.886-1.539A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.512-5.246-1.403l-.374-.22-3.893 1.018 1.002-3.786-.244-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.93 2 2 0 0 1 3.58 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.32a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}