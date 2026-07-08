/**
 * IremboPay Widget Proxy
 *
 * Fetches the IremboPay sandbox inline widget JavaScript server-side
 * (where the private 198.18.0.x IPs are reachable) and rewrites
 * hardcoded IremboPay URLs to our own proxy paths so the browser
 * never needs to connect to the private IPs directly.
 */
export async function GET() {
  const SANDBOX_WIDGET_URL =
    'https://dashboard.sandbox.irembopay.com/assets/payment/inline.js';

  try {
    const res = await fetch(SANDBOX_WIDGET_URL);

    if (!res.ok) {
      return new Response('Widget script not available', { status: 502 });
    }

    let js = await res.text();

    // Rewrite IremboPay hostnames → our proxy routes so the
    // browser reaches them through the Next.js server (which
    // CAN route to the 198.18.0.x private IPs).
    js = js.replace(
      /https:\/\/api\.sandbox\.irembopay\.com/g,
      '/api/irembopay-api',
    );
    js = js.replace(
      /https:\/\/dashboard\.sandbox\.irembopay\.com/g,
      '/api/irembopay-dashboard',
    );

    return new Response(js, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[IremboPay] Widget proxy error:', err.message);
    return new Response('Widget proxy error', { status: 502 });
  }
}
