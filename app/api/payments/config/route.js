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
  const base = (process.env.IREMBOPAY_BASE_URL || 'https://api.sandbox.irembopay.com')
    .trim()
    .replace(/\/+$/, '');

  const isSandbox = base.includes('sandbox');

  return Response.json(
    {
      environment: isSandbox ? 'sandbox' : 'production',
      widgetUrl: isSandbox
        ? '/api/irembopay-widget'
        : 'https://dashboard.irembopay.com/assets/payment/inline.js',
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
