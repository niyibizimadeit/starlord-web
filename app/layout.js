import './globals.css';
import { Playfair_Display, Lato } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CartProvider } from '@/components/CartContext';
import ConditionalLayout from '@/components/ConditionalLayout';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata = {
  title: 'STARLORD GROUP — Premium Accessories, Kigali',
  description: 'Premium phone cases, fashion accessories. Pay with MTN MoMo or Airtel Money. Delivery across Rwanda.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning
      className={`${playfair.variable} ${lato.variable}`}>
      <body>
        <ThemeProvider>
          <CartProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </CartProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}