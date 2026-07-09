/**
 * IremboPay API Proxy
 *
 * Proxies browser → server → IremboPay API calls so the browser
 * never needs direct connectivity to 198.18.0.x private IPs.
 *
 * NOTE: In Next.js 16, `params` is a Promise and MUST be awaited.
 */
const API_BASE = 'https://api.sandbox.irembopay.com';

// Endpoints matching this pattern hold the connection open and push a
// real-time payment result (SSE-style long-poll). A single attempt can
// sit for minutes while a customer fills in card details, and the
// connection can drop before any data arrives — from the network, an
// idle-connection timeout on Irembo's side, or elsewhere in the path.
// We reconnect transparently on the server so one dropped attempt
// doesn't surface as a dead stream to the browser.
const LONG_POLL_PATH_PATTERN = /\/notification$/;
const UPSTREAM_ATTEMPT_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 20; // roughly 20 minutes of retrying at 60s/attempt, capped by invoice expiry logic below
const INVOICE_EXPIRY_MS = 15 * 60 * 1000; // matches the invoice expiry set in payments/initiate

async function getPath(props) {
  const p = await props.params;
  const path = p?.path || [];
  return Array.isArray(path) ? path.join('/') : path;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function proxyGet(_request, props) {
  const pathStr = await getPath(props);
  const url = `${API_BASE}/${pathStr}`;
  const clientAccept = _request.headers.get('accept') || 'application/json';
  const isLongPoll = LONG_POLL_PATH_PATTERN.test(pathStr);

  const headers = {
    'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
    'X-API-Version': '2',
    accept: clientAccept,
  };

  // Regular fast endpoints (/status and everything else): single
  // attempt, no timeout wrapper needed since these already return
  // in under a second.
  if (!isLongPoll) {
    console.log('[IremboPay Proxy] GET', url);
    const res = await fetch(url, { headers });
    const resContentType = res.headers.get('content-type') || '';
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': resContentType || 'application/json' },
    });
  }

  // ── Long-poll endpoint ─────────────────────────────────────────────
  // IMPORTANT: we open the client-facing stream RIGHT NOW and do all
  // reconnect attempts *inside* it, forwarding bytes as they arrive.
  // The previous version awaited the entire retry loop (which can
  // legitimately take minutes, per the comment above) BEFORE ever
  // sending the browser anything — headers or bytes. The IremboPay
  // widget has its own, much shorter client-side timeout on this
  // call and was giving up ("Sorry, we have not received your
  // payment") long before our server-side retries ever succeeded,
  // even though the payment itself was fine and our own webhook-
  // driven poll picked it up correctly. Returning an open stream
  // immediately means the browser sees one continuously-live
  // connection, so our internal reconnects stay invisible to it —
  // matching how real SSE is supposed to behave.
  console.log('[IremboPay Proxy] GET', url, '(long-poll, streaming to client immediately)');

  const encoder = new TextEncoder();
  const startedAt = Date.now();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
        if (cancelled) return;

        if (Date.now() - startedAt > INVOICE_EXPIRY_MS) {
          console.warn(`[IremboPay Proxy] ${pathStr} stopped retrying — invoice window (15 min) elapsed`);
          try { controller.close(); } catch {}
          return;
        }

        let res;
        try {
          res = await fetchWithTimeout(url, { headers }, UPSTREAM_ATTEMPT_TIMEOUT_MS);
        } catch (err) {
          console.warn(
            `[IremboPay Proxy] ${pathStr} attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS} dropped (${err.message}), reconnecting...`,
          );
          continue;
        }

        const resContentType = res.headers.get('content-type') || '';

        if (resContentType.includes('text/event-stream')) {
          // Pipe this attempt's body straight into the already-open
          // client stream. If the upstream body ends without a
          // terminal event (a drop, not a real result), loop back
          // around and reconnect — the browser's own connection to
          // us never closes, so it never notices the hiccup.
          const reader = res.body.getReader();
          try {
            while (true) {
              if (cancelled) { reader.cancel().catch(() => {}); return; }
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (err) {
            console.warn(
              `[IremboPay Proxy] ${pathStr} stream read error on attempt ${attempt}, reconnecting...`,
              err.message,
            );
          }
          // Upstream body ended. Loop and reconnect — either it was a
          // genuine drop (per the sandbox behavior this was built
          // for), or the widget's own onmessage handler already
          // consumed a terminal event from the bytes we just forwarded,
          // in which case the widget will close the popup on its own
          // and this stream being kept open a little longer is harmless.
          continue;
        }

        // Non-SSE response (e.g. a plain JSON status body) — forward
        // once and end the stream; there is nothing to keep polling.
        const body = await res.text();
        controller.enqueue(encoder.encode(body));
        try { controller.close(); } catch {}
        return;
      }

      console.error(`[IremboPay Proxy] ${pathStr} gave up after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      try { controller.close(); } catch {}
    },
    cancel() {
      // Browser navigated away / closed the popup — stop retrying.
      cancelled = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
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