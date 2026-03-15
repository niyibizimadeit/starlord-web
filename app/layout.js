import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CartProvider } from '@/components/CartContext';
import Header from '@/components/Header';
import WhatsAppWidget from '@/components/WhatsAppWidget';

export const metadata = {
  title: 'STARLORD GROUP — Premium Accessories, Kigali',
  description:
    'Premium phone cases, fashion accessories. Pay with MTN MoMo or Airtel Money. Delivery across Rwanda.',
};

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div
        className="container"
        style={{
          padding: '40px 20px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 40,
        }}
      >
        <FooterBrand />
        <FooterShop />
        <FooterHelp />
        <FooterPayments />
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-faint)',
            letterSpacing: 0.5,
          }}
        >
          Copyright &copy; 2026 Powered by STARLORD GROUP
        </span>
      </div>
    </footer>
  );
}

function FooterBrand() {
  return (
    <div>
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--gold)',
          letterSpacing: 3,
          marginBottom: 6,
        }}
      >
        STARLORD
      </div>
      <div
        style={{
          fontSize: 8,
          color: 'var(--text-faint)',
          letterSpacing: 5,
          marginBottom: 16,
          textTransform: 'uppercase',
        }}
      >
        GROUP
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth: 220,
        }}
      >
        Premium accessories for everyday life. Based in Kigali, delivering across Rwanda.
      </p>
    </div>
  );
}

function FooterShop() {
  return (
    <div>
      <FooterHeading text="Shop" />
      <FooterLink href="/" text="All Products" />
      <FooterLink href="/?category=Tech" text="Tech" />
      <FooterLink href="/?category=Fashion" text="Fashion" />
      <FooterLink href="/?badge=SALE" text="Sale" />
    </div>
  );
}

function FooterHelp() {
  return (
    <div>
      <FooterHeading text="Help" />
      <FooterLink href="/track" text="Track Order" />
      <FooterLink href="/about" text="About Us" />
      <FooterLink href="/faq" text="FAQ" />
      <FooterLink href="/returns" text="Returns" />
      <FooterLink href="/account" text="My Account" />
      <FooterLink href="/contact" text="Contact Us" />
    </div>
  );
}

function FooterPayments() {
  return (
    <div>
      <FooterHeading text="We Accept" />
      <PaymentBadge text="MTN Mobile Money" />
      <PaymentBadge text="Airtel Money" />
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: 'var(--text-faint)',
          lineHeight: 1.7,
        }}
      >
        Fast courier delivery across Kigali and Rwanda
      </div>
    </div>
  );
}

function FooterHeading({ text }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 16,
      }}
    >
      {text}
    </div>
  );
}

function FooterLink({ href, text }) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        fontSize: 13,
        color: 'var(--text-muted)',
        marginBottom: 10,
        transition: 'color 0.2s',
      }}
    >
      {text}
    </a>
  );
}

function PaymentBadge({ text }) {
  return (
    <div
      style={{
        display: 'inline-block',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '7px 12px',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-muted)',
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      {text}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <WhatsAppWidget />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
