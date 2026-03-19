import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CartProvider } from '@/components/CartContext';
import ConditionalLayout from '@/components/ConditionalLayout';

export const metadata = {
  title: 'STARLORD GROUP — Premium Accessories, Kigali',
  description: 'Premium phone cases, fashion accessories. Pay with MTN MoMo or Airtel Money. Delivery across Rwanda.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <CartProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}