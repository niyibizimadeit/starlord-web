'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { useCart } from './CartContext';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const [searchValue, setSearchValue] = useState('');
  const [user, setUser] = useState(null);
  const [navCategories, setNavCategories] = useState([]);

  useEffect(() => {
    const supabase = createClient();

    // Auth
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch nav categories
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .eq('show_in_nav', true)
      .order('sort_order', { ascending: true })
      .limit(4)
      .then(({ data, error }) => {
        setNavCategories(data || []);
      });

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchValue.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchValue.trim())}`;
    }
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: theme === 'dark'
        ? 'rgba(17,14,10,0.96)'
        : 'rgba(250,246,240,0.96)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>

        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 800, fontSize: 20,
            color: 'var(--gold)', letterSpacing: 3, lineHeight: 1,
          }}>STARLORD</div>
          <div style={{
            fontSize: 8, color: 'var(--text-muted)',
            letterSpacing: 5, marginTop: 2,
          }}>GROUP</div>
        </Link>

        {/* Desktop Nav — dynamic categories */}
        <nav style={{ display: 'flex', gap: 32 }} className="desktop-nav">
          {navCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.slug)}`}
              style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--text-muted)', letterSpacing: 1,
                textTransform: 'uppercase', transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--gold)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              {cat.name}
            </Link>
          ))}
          {/* Always show Products link */}
          <Link
            href="/products"
            style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: 1,
              textTransform: 'uppercase', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
          </Link>
        </nav>

        {/* Desktop Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="desktop-nav">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search products..."
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px 0 0 8px',
                padding: '8px 14px',
                color: 'var(--text)',
                fontSize: 13, outline: 'none', width: 220,
              }}
            />
            <button type="submit" style={{
              width: 40, height: 37,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--gold)', border: '1px solid var(--gold)',
              borderRadius: '0 8px 8px 0', color: '#000', fontSize: 16,
            }} aria-label="Search">
              <SearchIcon />
            </button>
          </form>

          <button onClick={toggleTheme} style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)', fontSize: 16,
          }} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link href={user ? '/account' : '/login'} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 14px',
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
          }}>
            <PersonIcon />
            <span>{user ? 'Account' : 'Login'}</span>
          </Link>

          <Link href="/cart" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--gold)', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#000',
          }}>
            <CartIcon />
            <span>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
          </Link>
        </div>

        {/* Mobile Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-actions">
          <button onClick={toggleTheme} style={{
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
          }} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link href={user ? '/account' : '/login'} style={{
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
          }}>
            <PersonIcon />
          </Link>

          <Link href="/cart" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--gold)', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#000',
          }}>
            <CartIcon />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Mobile Search */}
      <div style={{ padding: '0 16px 12px' }} className="mobile-search">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search products..."
            style={{
              flex: 1, background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px 0 0 10px',
              padding: '11px 16px', color: 'var(--text)',
              fontSize: 14, outline: 'none',
            }}
          />
          <button type="submit" style={{
            height: 44, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gold)', border: 'none',
            borderRadius: '0 10px 10px 0', color: '#000',
          }} aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-actions { display: none !important; }
          .mobile-search  { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}