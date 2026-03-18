'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import WhatsAppWidget from './WhatsAppWidget';
import Link from 'next/link';

function PaymentBadge({ text }) {
  return (
    <div style={{
      display: 'inline-block', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 6,
      padding: '7px 12px', fontSize: 12, fontWeight: 700,
      color: 'var(--text-muted)', marginBottom: 8, marginRight: 8,
    }}>{text}</div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="container" style={{
        padding: '40px 20px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 40,
      }}>
        {/* Brand */}
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 800, color: 'var(--gold)', letterSpacing: 3, marginBottom: 6 }}>STARLORD</div>
          <div style={{ fontSize: 8, color: 'var(--text-faint)', letterSpacing: 5, marginBottom: 16, textTransform: 'uppercase' }}>GROUP</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 220 }}>Premium accessories for everyday life. Based in Kigali, delivering across Rwanda.</p>
        </div>

        {/* Shop */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Shop</div>
          {[['/', 'All Products'], ['/products?category=Tech', 'Tech'], ['/products?category=Fashion', 'Fashion'], ['/products?badge=SALE', 'Sale']].map(([href, text]) => (
            <Link key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{text}</Link>
          ))}
        </div>

        {/* Help */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Help</div>
          {[['/track', 'Track Order'], ['/about', 'About Us'], ['/faq', 'FAQ'], ['/returns', 'Returns'], ['/account', 'My Account'], ['/contact', 'Contact Us'], ['/terms', 'Terms & Conditions'],].map(([href, text]) => (
            <Link key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{text}</Link>
          ))}
        </div>

        {/* Payments */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>We Accept</div>
          <PaymentBadge text="MTN Mobile Money" />
          <PaymentBadge text="Airtel Money" />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.7 }}>Fast courier delivery across Kigali and Rwanda</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: 0.5 }}>
          Copyright &copy; 2026 Powered by STARLORD GROUP
        </span>
      </div>
    </footer>
  );
}

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <main>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppWidget />}
    </>
  );
}