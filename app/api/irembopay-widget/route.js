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
    // CAN route to the 198.18.0.x private IPs). These are literal
    // domain strings, stable across widget builds.
    js = js.replace(
      /https:\/\/api\.sandbox\.irembopay\.com/g,
      '/api/irembopay-api',
    );
    js = js.replace(
      /https:\/\/dashboard\.sandbox\.irembopay\.com/g,
      '/api/irembopay-dashboard',
    );

    // ── Fix webpack chunk loading ─────────────────────────────────
    // The widget auto-detects its public path from
    // document.currentScript.src, which resolves to /api/ (because
    // the script is served from /api/irembopay-widget). But chunks
    // live under /api/irembopay-dashboard/assets/payment/. Override
    // the auto-detected value so webpack loads chunks from the right
    // location.
    //
    // Previous version matched the exact minified variable name
    // ("__webpack_require__.p=e"), which silently no-ops if Irembo
    // ships a build where that variable isn't named "e". This regex
    // matches the general shape of the assignment instead, so it
    // survives variable renaming across builds.
    const publicPathPattern = /__webpack_require__\.p\s*=\s*[^,;]+/;
    if (publicPathPattern.test(js)) {
      js = js.replace(
        publicPathPattern,
        '__webpack_require__.p="/api/irembopay-dashboard/assets/payment/"',
      );
    } else {
      console.warn(
        '[IremboPay Proxy] Could not find __webpack_require__.p assignment — ' +
        'chunk loading may 404 if the widget build changed its bootstrap format.',
      );
    }

    // ── Fix postMessage target origin ─────────────────────────────
    // The widget uses the popup URL as the target origin for
    // window.postMessage(). After our URL rewrites, that URL is a
    // relative path like /api/irembopay-dashboard/..., and
    // postMessage requires an absolute origin (protocol://host:port)
    // or the literal string "*". A relative path throws a
    // DOMException, which some widget builds treat as fatal and
    // close the modal.
    //
    // Previous version string-replaced one exact minified call
    // signature, which silently no-ops if the widget's minifier
    // renames any of the variables involved. Instead, patch
    // Window.prototype.postMessage globally: try the call as-is,
    // and if it throws (e.g. invalid origin), retry with "*". This
    // works regardless of variable names or how many places in the
    // widget call postMessage.
    const postMessagePatch = `
(function() {
  if (window.__irembopayPostMessagePatched) return;
  window.__irembopayPostMessagePatched = true;
  var _originalPostMessage = Window.prototype.postMessage;
  Window.prototype.postMessage = function(message, targetOrigin, transfer) {
    try {
      return _originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (err) {
      try {
        return _originalPostMessage.call(this, message, '*', transfer);
      } catch (err2) {
        console.error('[IremboPay Proxy] postMessage failed with wildcard origin too:', err2);
      }
    }
  };
})();
`;
    js = postMessagePatch + js;

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