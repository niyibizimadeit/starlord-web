/**
 * Runtime payment configuration.
 *
 * The card widget's script URL has to follow IREMBOPAY_BASE_URL, but that
 * variable is server-only — it must not be exposed to the browser. Resolving
 * the URL here means flipping IREMBOPAY_BASE_URL to production also flips
 * the widget off the sandbox proxy, with no second client-side switch to
 * forget. Everything else (secret key, account id, product code) is already
 * read server-side at request time.
 */
export async function GET() {
  // If the env var is missing in production, default the *widget* to the
  // production host. /api/payments/initiate already fails loudly in that
  // state, so the customer can't start a payment — this just avoids sending
  // the browser at a sandbox proxy that is disabled in production.
  const fallbackBase = process.env.NODE_ENV === 'production'
    ? 'https://api.irembopay.com'
    : 'https://api.sandbox.irembopay.com';

  const raw = (process.env.IREMBOPAY_BASE_URL || '').trim();
  const base = (raw || fallbackBase).replace(/\/+$/, '');

  const isSandbox = base.includes('sandbox');
  // Non-secret diagnostic: confirms what the *running deployment* actually
  // received from Vercel. The API host is public, so exposing it is safe.
  const baseUrlValid = raw.length > 0 && !raw.replace(/\/+$/, '').endsWith('/payments');

  return Response.json(
    {
      environment: isSandbox ? 'sandbox' : 'production',
      widgetUrl: isSandbox
        ? '/api/irembopay-widget'
        : 'https://dashboard.irembopay.com/assets/payment/inline.js',
      baseUrl: raw || null,
      baseUrlValid,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
