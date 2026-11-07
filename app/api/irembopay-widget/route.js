/**
 * IremboPay Widget Proxy — SANDBOX TESTING ONLY
 *
 * Fetches the IremboPay sandbox inline widget JavaScript server-side
 * (where the sandbox hosts are reachable on dev networks that resolve
 * them to fake-IPs) and rewrites hardcoded IremboPay URLs to our own
 * proxy paths so the browser never needs to connect to those hosts.
 *
 * Production loads the real production widget directly from
 * dashboard.irembopay.com (see app/checkout/page.js) and must never route
 * through this proxy. It is enabled only while the server is pointed at the
 * sandbox, and force-disabled for any non-sandbox base — even if a stale
 * env var tries to enable it.
 */
const configuredBase = (process.env.IREMBOPAY_BASE_URL || '').trim().toLowerCase();
const IS_SANDBOX = configuredBase
  ? configuredBase.includes('sandbox')
  : process.env.NODE_ENV !== 'production';
const PROXY_ENABLED = IS_SANDBOX;

export async function GET(request) {
  if (!PROXY_ENABLED) {
    return new Response('Not found', { status: 404 });
  }

  const SANDBOX_WIDGET_URL =
    'https://dashboard.sandbox.irembopay.com/assets/payment/inline.js';

  // IMPORTANT: rewrite to an ABSOLUTE url (scheme + host), not a bare
  // relative path. The widget reuses these same hardcoded strings in
  // more places than just fetch() calls — including as the
  // `targetOrigin` argument to postMessage(), which throws a
  // SyntaxError if given anything other than a real absolute origin
  // or the literal "*". A relative path like "/api/irembopay-dashboard"
  // is never valid there, even though it works fine for normal
  // fetch/navigation. Deriving the origin from the incoming request
  // (rather than hardcoding localhost) also means this works
  // correctly in production on starlordgroup.rw.
  const origin = new URL(request.url).origin;

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
      `${origin}/api/irembopay-api`,
    );
    js = js.replace(
      /https:\/\/dashboard\.sandbox\.irembopay\.com/g,
      `${origin}/api/irembopay-dashboard`,
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
    const publicPathPattern = /__webpack_require__\.p\s*=\s*\w+/;
    if (publicPathPattern.test(js)) {
      js = js.replace(
        publicPathPattern,
        `__webpack_require__.p="${origin}/api/irembopay-dashboard/assets/payment/"`,
      );
    } else {
      console.warn(
        '[IremboPay Proxy] Could not find __webpack_require__.p assignment — ' +
        'chunk loading may 404 if the widget build changed its bootstrap format.',
      );
    }

    // ── Fix postMessage target origin (belt-and-braces) ───────────
    // Even with the absolute-origin rewrite above, keep this patch as
    // a safety net for any postMessage call whose target origin comes
    // from somewhere we didn't anticipate (e.g. a value read back from
    // document.referrer, or a future widget build that computes it
    // differently). Try the call as-is, and if it throws (e.g.
    // invalid origin), retry with "*". This works regardless of
    // variable names or how many places in the widget call
    // postMessage.
    //
    // NOTE: this only patches postMessage in the window this script
    // runs in (the main tab hosting the widget). The IremboPay popup
    // window (served via /api/irembopay-dashboard/...) is a SEPARATE
    // JS context and needs the same patch injected there — see the
    // irembopay-dashboard proxy route.
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