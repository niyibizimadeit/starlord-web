import { createServiceClient } from '@/lib/supabase/server';
import BannerSlider from '@/components/BannerSlider';
import ProductGrid from '@/components/ProductGrid';
import CategoryStrip from '@/components/CategoryStrip';

export const revalidate = 60;

async function getProducts() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function HomePage({ searchParams }) {
  const params   = await searchParams;
  const products = await getProducts();
  const category = params?.category || 'All';
  const search   = params?.search   || '';
  const badge    = params?.badge    || '';

  return (
    <>
      <BannerSlider />
      <TrustBar />
      <ProductGrid
        initialProducts={products}
        initialCategory={category}
        initialSearch={search}
        initialBadge={badge}
      />
    </>
  );
}

function TrustBar() {
  const items = [
    { icon: BoltIcon,   text: 'Under 60s Checkout' },
    { icon: ShieldIcon, text: 'Secure Payments'     },
    { icon: TruckIcon,  text: 'Courier Delivery'    },
    { icon: PhoneIcon,  text: 'MoMo and Airtel'     },
  ];

  return (
    <section style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 0,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 0,
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px',
          }}>
            <span style={{ color: 'var(--gold)' }}><BoltIcon /></span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              Under 60s Checkout
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px',
          }}>
            <span style={{ color: 'var(--gold)' }}><ShieldIcon /></span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              Secure Payments
            </span>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px',
          }}>
            <span style={{ color: 'var(--gold)' }}><TruckIcon /></span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              Courier Delivery
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px',
          }}>
            <span style={{ color: 'var(--gold)' }}><PhoneIcon /></span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              MoMo and Airtel
            </span>
          </div>
        </div>
      </div>
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