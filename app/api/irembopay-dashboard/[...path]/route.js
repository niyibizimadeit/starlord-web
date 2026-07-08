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

export async function GET(_request, props) {
  try {
    const p = await props.params;
    const path = p?.path || [];
    const pathStr = Array.isArray(path) ? path.join('/') : path;
    const url = `${DASHBOARD_BASE}/${pathStr}`;
    console.log('[IremboPay Dashboard Proxy] GET', url);

    const res = await fetch(url, {
      headers: { accept: _request.headers.get('accept') || '*/*' },
    });

    const contentType = res.headers.get('content-type') || '';
    let body = await res.text();

    // Rewrite hardcoded IremboPay hostnames in text responses
    if (contentType.includes('html') || contentType.includes('javascript') || contentType.includes('css')) {
      body = body
        .replace(/https:\/\/api\.sandbox\.irembopay\.com/g, '/api/irembopay-api')
        .replace(/https:\/\/dashboard\.sandbox\.irembopay\.com/g, '/api/irembopay-dashboard');
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
