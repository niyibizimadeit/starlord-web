import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — STARLORD GROUP',
  description: 'Terms and conditions for shopping with STARLORD GROUP, Kigali Rwanda.',
};

const LAST_UPDATED = 'March 2026';

function Section({ title, color = 'var(--gold)', children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '20px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color,
        letterSpacing: 2, textTransform: 'uppercase',
        marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Item({ icon, text }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      marginBottom: 10,
    }}>
      <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function Para({ children }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
      {children}
    </p>
  );
}

export default function TermsPage() {
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
          Legal
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 10, lineHeight: 1.2,
        }}>
          Terms &amp; <span style={{ color: 'var(--gold)' }}>Conditions</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
          By shopping with STARLORD GROUP, you agree to the following terms.
          Please read them carefully before placing an order.
        </p>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Last updated: {LAST_UPDATED}
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 1. About Us */}
        <Section title="1. About Us">
          <Para>
            STARLORD GROUP is a premium accessories retailer based in Kigali, Rwanda.
            We sell phone cases, fashion accessories, and related products, delivering
            across Kigali and Rwanda.
          </Para>
          <Para>
            By accessing our website or placing an order, you confirm that you have read,
            understood, and agree to be bound by these Terms and Conditions.
          </Para>
        </Section>

        {/* 2. Products & Availability */}
        <Section title="2. Products & Availability">
          <Item icon="·" text="All products are subject to availability. Stock levels are updated regularly but may not reflect real-time inventory." />
          <Item icon="·" text="We reserve the right to discontinue any product at any time without notice." />
          <Item icon="·" text="Product images are for illustration purposes. Colours and details may vary slightly from the actual product." />
          <Item icon="·" text="If an item you ordered is out of stock, we will contact you to offer an alternative product." />
        </Section>

        {/* 3. Pricing */}
        <Section title="3. Pricing & Currency">
          <Item icon="·" text="All prices are displayed in Rwandan Francs (RWF) and include any applicable taxes." />
          <Item icon="·" text="Prices may change without notice. The price charged will be the price shown at the time of your order." />
          <Item icon="·" text="Delivery fees are shown separately at checkout and may vary based on location." />
          <Item icon="·" text="We reserve the right to correct any pricing errors, even after an order has been placed." />
        </Section>

        {/* 4. Orders & Payment */}
        <Section title="4. Orders & Payment">
          <Para>
            We accept payment via MTN Mobile Money and Airtel Money. Payment must be
            completed before your order is dispatched.
          </Para>
          <Item icon="·" text="Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order." />
          <Item icon="·" text="You will receive an order reference number upon successful placement. Save this to track your order." />
          <Item icon="·" text="Orders are subject to stock availability and payment confirmation." />
          <Item icon="·" text="If payment fails or cannot be verified, your order may be cancelled." />
        </Section>

        {/* 5. Delivery */}
        <Section title="5. Delivery">
          <Item icon="·" text="We deliver across Kigali and Rwanda. Delivery fees are calculated at checkout." />
          <Item icon="·" text="Delivery times are estimates and may vary depending on your location and order volume." />
          <Item icon="·" text="Our courier will contact you at the phone number provided at checkout to arrange delivery." />
          <Item icon="·" text="You are responsible for ensuring someone is available to receive the delivery at the specified address." />
          <Item icon="·" text="STARLORD GROUP is not liable for delays caused by circumstances beyond our control." />
        </Section>

        {/* 6. Returns & Exchanges */}
        <Section title="6. Returns & Exchanges">
          <Para>
            Our return policy allows you to request a return within{' '}
            <strong style={{ color: 'var(--text)' }}>6 hours of delivery confirmation</strong>.
            Please review our full policy for details.
          </Para>
          <Item icon="·" text="Returns result in a replacement product only — we do not offer cash refunds." />
          <Item icon="·" text="The customer is responsible for return delivery costs." />
          <Item icon="·" text="Items must be unused, in original packaging, and in the same condition as received." />
          <Item icon="·" text="Return requests must be submitted through your account within the 6-hour window." />
          <div style={{ marginTop: 12 }}>
            <Link href="/returns" style={{
              fontSize: 13, color: 'var(--gold)', fontWeight: 700,
            }}>
              View full Returns Policy →
            </Link>
          </div>
        </Section>

        {/* 7. Customer Accounts */}
        <Section title="7. Customer Accounts">
          <Item icon="·" text="You may create an account to track orders and manage your information." />
          <Item icon="·" text="You are responsible for maintaining the security of your account credentials." />
          <Item icon="·" text="You must provide accurate and up-to-date information when creating an account or placing an order." />
          <Item icon="·" text="We reserve the right to suspend or terminate accounts that violate these terms." />
        </Section>

        {/* 8. Privacy */}
        <Section title="8. Privacy & Data">
          <Para>
            We collect personal information including your name, phone number, email address,
            and delivery address solely to process and fulfil your orders.
          </Para>
          <Item icon="·" text="Your data is stored securely and is never sold to third parties." />
          <Item icon="·" text="We may use your contact details to send order updates and relevant promotions." />
          <Item icon="·" text="You may request deletion of your account and associated data by contacting us." />
          <Item icon="·" text="By using our site, you consent to the collection and use of your data as described." />
        </Section>

        {/* 9. Intellectual Property */}
        <Section title="9. Intellectual Property">
          <Para>
            All content on this website — including images, text, logos, and design — is the
            property of STARLORD GROUP and may not be reproduced, distributed, or used
            without our written permission.
          </Para>
        </Section>

        {/* 10. Limitation of Liability */}
        <Section title="10. Limitation of Liability">
          <Item icon="·" text="STARLORD GROUP is not liable for any indirect, incidental, or consequential damages arising from the use of our products or website." />
          <Item icon="·" text="Our liability is limited to the value of the order placed." />
          <Item icon="·" text="We are not responsible for delays, losses, or damages caused by courier services, network issues, or events beyond our control." />
        </Section>

        {/* 11. Changes to Terms */}
        <Section title="11. Changes to These Terms">
          <Para>
            We reserve the right to update these Terms and Conditions at any time.
            Changes will be posted on this page with an updated date. Continued use of
            our website after changes constitutes acceptance of the new terms.
          </Para>
        </Section>

        {/* 12. Contact */}
        <Section title="12. Contact Us">
          <Para>
            If you have any questions about these terms, please reach out to us:
          </Para>
          <Item icon="📱" text="WhatsApp: +250 788 678 590" />
          <Item icon="📍" text="Kigali, Rwanda" />
          <div style={{ marginTop: 12 }}>
            <Link href="/contact" style={{
              fontSize: 13, color: 'var(--gold)', fontWeight: 700,
            }}>
              Visit our Contact page →
            </Link>
          </div>
        </Section>

        {/* Footer note */}
        <div style={{
          textAlign: 'center',
          padding: '8px 0',
          fontSize: 12,
          color: 'var(--text-faint)',
          lineHeight: 1.6,
        }}>
          These terms govern your use of starlordgroup.rw and all purchases made through our platform.
          <br />By placing an order you confirm you have read and agreed to these terms.
        </div>

        {/* CTA */}
        <Link href="/products" style={{
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
          Continue Shopping
        </Link>

      </div>
    </div>
  );
}