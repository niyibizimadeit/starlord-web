'use client';

function TrustBar() {
  return (
    <section style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <div className="trustbar-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 20px',
      }}>
        <div className="trust-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <span style={{ color: 'var(--gold)' }}><BoltIcon /></span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            Under 60s Checkout
          </span>
        </div>
        <div className="trust-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <span style={{ color: 'var(--gold)' }}><ShieldIcon /></span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            Secure Payments
          </span>
        </div>
        <div className="trust-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <span style={{ color: 'var(--gold)' }}><TruckIcon /></span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            Courier Delivery
          </span>
        </div>
        <div className="trust-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
        }}>
          <span style={{ color: 'var(--gold)' }}><PhoneIcon /></span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            MoMo and Airtel
          </span>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 767px) {
          .trustbar-container {
            grid-template-columns: repeat(2, 1fr) !important;
            justify-items: center !important;
          }
          .trust-item:nth-child(1),
          .trust-item:nth-child(2) {
            border-bottom: 1px solid var(--border-subtle) !important;
            border-right: 1px solid var(--border-subtle) !important;
            padding: 16px 24px !important;
            height: 72px !important;
          }
          .trust-item:nth-child(2) {
            border-right: none !important;
          }
          .trust-item:nth-child(3),
          .trust-item:nth-child(4) {
            border-right: 1px solid var(--border-subtle) !important;
            padding: 16px 24px !important;
            height: 72px !important;
          }
          .trust-item:nth-child(4) {
            border-right: none !important;
          }
          .trust-item span:last-child {
            font-size: 13px !important;
            line-height: 1.3 !important;
            text-align: center !important;
          }
        }
      `}</style>
    </section>
  );
}

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

export default TrustBar;
