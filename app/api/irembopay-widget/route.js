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

    // Fix webpack chunk loading: the widget auto-detects its public
    // path from document.currentScript.src, which resolves to /api/
    // (because the script is at /api/irembopay-widget).  But chunks
    // live under /api/irembopay-dashboard/assets/payment/.  Override
    // the auto-detected value so webpack loads chunks from the right
    // location.
    js = js.replace(
      '__webpack_require__.p=e',
      '__webpack_require__.p="/api/irembopay-dashboard/assets/payment/"',
    );

    // Fix postMessage target origin: the widget uses the popup URL
    // as the target origin for window.postMessage(), but after our
    // URL rewrites that URL is a relative path like /api/irembopay-...
    // postMessage requires an absolute origin (protocol://host:port).
    // Replace with "*" (wildcard) — the popup is same-origin anyway.
    js = js.replace(
      'postMessage({form:r,formAction:t.formAction,details:{name:d,number:o,expiryDate:s,cvv:l}},c)',
      'postMessage({form:r,formAction:t.formAction,details:{name:d,number:o,expiryDate:s,cvv:l}},"*")',
    );

    return new Response(js, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[IremboPay] Widget proxy error:', err.message);
    return new Response('Widget proxy error', { status: 502 });
  }
}
