/**
 * IremboPay Dashboard Proxy
 *
 * Proxies browser → server → IremboPay Dashboard assets (CSS,
 * HTML popup, font files, etc.) so the browser never needs
 * direct connectivity to 198.18.0.x private IPs.
 *
 * NOTE: In Next.js 16, `params` is a Promise and MUST be awaited.
 */
const DASHBOARD_BASE = 'https://dashboard.sandbox.irembopay.com';

// Injected into any HTML page this route serves (i.e. the IremboPay
// popup itself, pop-up.html). The popup is a SEPARATE window/JS
// context from the parent tab running the widget — the postMessage
// patch in irembopay-widget/route.js only protects the parent, not
// this popup. Without this, any postMessage() call the popup makes
// back to window.opener with an invalid target origin throws a
// SyntaxError that some widget builds treat as fatal (matches the
// "Sorry, we have not received your payment" failure after the
// SyntaxError in the popup).
const POST_MESSAGE_PATCH = `<script>
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
        console.error('[IremboPay Proxy] popup postMessage failed with wildcard origin too:', err2);
      }
    }
  };
})();
</script>`;

export async function GET(_request, props) {
  try {
    const p = await props.params;
    const path = p?.path || [];
    const pathStr = Array.isArray(path) ? path.join('/') : path;
    const url = `${DASHBOARD_BASE}/${pathStr}`;
    console.log('[IremboPay Dashboard Proxy] GET', url);

    // IMPORTANT: rewrite to an ABSOLUTE origin (scheme + host), not a
    // bare relative path. This page (and the widget) reuse these same
    // hardcoded IremboPay hostnames as postMessage() targetOrigin
    // values in places, and a relative path is never valid there —
    // it throws a SyntaxError. Deriving the origin from the incoming
    // request (rather than hardcoding localhost) also means this
    // works correctly once deployed to starlordgroup.rw.
    const origin = new URL(_request.url).origin;

    const res = await fetch(url, {
      headers: { accept: _request.headers.get('accept') || '*/*' },
    });

    const contentType = res.headers.get('content-type') || '';
    let body = await res.text();

    // Rewrite hardcoded IremboPay hostnames in text responses
    if (contentType.includes('html') || contentType.includes('javascript') || contentType.includes('css')) {
      body = body
        .replace(/https:\/\/api\.sandbox\.irembopay\.com/g, `${origin}/api/irembopay-api`)
        .replace(/https:\/\/dashboard\.sandbox\.irembopay\.com/g, `${origin}/api/irembopay-dashboard`);
    }

    // For the popup HTML page specifically: inject the postMessage
    // safety patch so this window (a separate JS context from the
    // parent tab) doesn't crash when it messages window.opener with
    // an origin the browser considers invalid.
    if (contentType.includes('html')) {
      if (body.includes('</head>')) {
        body = body.replace('</head>', `${POST_MESSAGE_PATCH}</head>`);
      } else {
        // No <head> tag found (unlikely, but don't silently skip) —
        // prepend so the patch still runs before any other inline
        // scripts in the document.
        body = POST_MESSAGE_PATCH + body;
      }
    }

    const responseHeaders = {};
    if (pathStr.endsWith('.css')) {
      responseHeaders['content-type'] = 'text/css';
    } else if (pathStr.endsWith('.js')) {
      responseHeaders['content-type'] = 'application/javascript';
    } else if (contentType) {
      responseHeaders['content-type'] = contentType;
    }
    responseHeaders['cache-control'] = 'public, s-maxage=86400, stale-while-revalidate=3600';

    return new Response(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[IremboPay Dashboard Proxy] error:', err.message);
    return new Response('Proxy error', { status: 502 });
  }
}