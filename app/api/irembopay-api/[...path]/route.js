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

async function proxyGet(_request, props) {
  const pathStr = await getPath(props);
  const url = `${API_BASE}/${pathStr}`;
  const clientAccept = _request.headers.get('accept') || 'application/json';
  console.log('[IremboPay Proxy] GET', url);

  const res = await fetch(url, {
    headers: {
      'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
      'X-API-Version': '2',
      accept: clientAccept,
    },
  });

  const resContentType = res.headers.get('content-type') || '';

  // SSE (Server-Sent Events) — pipe the response stream through.
  // We use a TransformStream to relay data without buffering, and
  // forward the IremboPay response headers so the browser treats
  // it as a real SSE connection.
  if (resContentType.includes('text/event-stream')) {
    console.log('[IremboPay Proxy] SSE stream opened');
    // Forward response headers from IremboPay
    const sseHeaders = {
      'content-type': 'text/event-stream',
      'cache-control': res.headers.get('cache-control') || 'no-cache',
      connection: 'keep-alive',
    };
    // Pipe IremboPay's body → browser, handling stream errors
    const stream = new ReadableStream({
      start(controller) {
        const reader = res.body.getReader();
        function pump() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            pump();
          }).catch(() => {
            // Stream error — close gracefully so the browser can
            // reconnect rather than getting a truncated response.
            controller.close();
          });
        }
        pump();
      },
    });
    return new Response(stream, { status: 200, headers: sseHeaders });
  }

  // Regular JSON/text response — buffer it
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': resContentType || 'application/json' },
  });
}

export async function GET(_request, props) {
  try {
    return await proxyGet(_request, props);
  } catch (err) {
    console.error('[IremboPay Proxy] GET error:', err.message);
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}

async function proxyWithBody(method, _request, props) {
  const pathStr = await getPath(props);
  const url = `${API_BASE}/${pathStr}`;
  const clientAccept = _request.headers.get('accept') || 'application/json';
  const clientContentType = _request.headers.get('content-type') || 'application/json';
  console.log('[IremboPay Proxy]', method, url);

  const body = await _request.text();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': clientContentType,
      'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
      'X-API-Version': '2',
      accept: clientAccept,
    },
    body: body || undefined,
  });

  const resBody = await res.text();
  return new Response(resBody, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}

export async function POST(_request, props) {
  try { return await proxyWithBody('POST', _request, props); }
  catch (e) {
    console.error('[IremboPay Proxy] POST error:', e.message);
    return new Response(`Proxy error: ${e.message}`, { status: 502 });
  }
}

export async function PUT(_request, props) {
  try { return await proxyWithBody('PUT', _request, props); }
  catch (e) {
    console.error('[IremboPay Proxy] PUT error:', e.message);
    return new Response(`Proxy error: ${e.message}`, { status: 502 });
  }
}
