import '@/app/globals.css';

export const metadata = {
  title: 'Admin Panel — STARLORD GROUP',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function AdminLayout({ children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      {children}
    </div>
  );
}