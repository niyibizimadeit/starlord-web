/**
 * IremboPay API Proxy
 *
 * Proxies browser → server → IremboPay API calls so the browser
 * never needs direct connectivity to 198.18.0.x private IPs.
 *
 * NOTE: In Next.js 16, `params` is a Promise and MUST be awaited.
 */
const API_BASE = 'https://api.sandbox.irembopay.com';

async function getPath(props) {
  const p = await props.params;
  const path = p?.path || [];
  return Array.isArray(path) ? path.join('/') : path;
}

export async function GET(_request, props) {
  try {
    const pathStr = await getPath(props);
    const url = `${API_BASE}/${pathStr}`;
    console.log('[IremboPay Proxy] GET', url);

    const res = await fetch(url, {
      headers: {
        'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
        'X-API-Version': '2',
        accept: 'application/json',
      },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[IremboPay Proxy] GET error:', err.message);
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}

export async function POST(_request, props) {
  try {
    const pathStr = await getPath(props);
    const url = `${API_BASE}/${pathStr}`;
    console.log('[IremboPay Proxy] POST', url);

    const body = await _request.text();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': _request.headers.get('content-type') || 'application/json',
        'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
        'X-API-Version': '2',
        accept: 'application/json',
      },
      body: body || undefined,
    });

    const resBody = await res.text();
    return new Response(resBody, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[IremboPay Proxy] POST error:', err.message);
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}

export async function PUT(_request, props) {
  try {
    const pathStr = await getPath(props);
    const url = `${API_BASE}/${pathStr}`;
    console.log('[IremboPay Proxy] PUT', url);

    const body = await _request.text();
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': _request.headers.get('content-type') || 'application/json',
        'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
        'X-API-Version': '2',
      },
      body: body || undefined,
    });

    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[IremboPay Proxy] PUT error:', err.message);
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
