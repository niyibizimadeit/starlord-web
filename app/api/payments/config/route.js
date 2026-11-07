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
  let base = (raw || fallbackBase).replace(/\/+$/, '');

  // The docs quote the resource base as .../payments; strip it so the widget
  // routing matches what /api/payments/initiate actually uses.
  const baseUrlNormalized = base.endsWith('/payments');
  if (baseUrlNormalized) base = base.slice(0, -'/payments'.length);

  const isSandbox = base.includes('sandbox');

  return Response.json(
    {
      environment: isSandbox ? 'sandbox' : 'production',
      widgetUrl: isSandbox
        ? '/api/irembopay-widget'
        : 'https://dashboard.irembopay.com/assets/payment/inline.js',
      // Non-secret diagnostics: the API host is public. These show what the
      // running deployment actually received and what it ended up using.
      baseUrl: base,
      baseUrlConfigured: raw.length > 0,
      baseUrlNormalized,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
