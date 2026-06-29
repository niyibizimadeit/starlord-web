import { createServiceClient } from '@/lib/supabase/server';

const BASE_URL = process.env.IREMBOPAY_BASE_URL || 'https://api.sandbox.irembopay.com';

function irembopayHeaders() {
  return {
    'Content-Type': 'application/json',
    'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
    'X-API-Version': '2',
  };
}

export async function POST(request) {
  try {
    const { orderId, reference, amount, phone, method } = await request.json();

    if (!orderId || !reference || !amount || !phone || !method) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status, customer_name, customer_phone')
      .eq('id', orderId)
      .eq('reference', reference)
      .single();

    if (orderError || !order) {
      console.error('Order lookup error:', orderError);
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.payment_status !== 'pending') {
      return Response.json({ error: 'Order already processed' }, { status: 409 });
    }

    // Step 1: Create invoice
    const expiryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const invoiceRes = await fetch(`${BASE_URL}/payments/invoices`, {
      method: 'POST',
      headers: irembopayHeaders(),
      body: JSON.stringify({
        transactionId: reference,
        paymentAccountIdentifier: process.env.IREMBOPAY_PAYMENT_ACCOUNT_ID,
        paymentItems: [
          {
            code: process.env.IREMBOPAY_PRODUCT_CODE,
            quantity: 1,
            unitAmount: amount,
          },
        ],
        expiryAt,
        description: `Order ${reference} - Starlord Group`,
        language: 'EN',
        customer: {
          name: order.customer_name,
          phoneNumber: order.customer_phone,
        },
      }),
    });

    const invoiceResult = await invoiceRes.json();

    if (!invoiceRes.ok || !invoiceResult.success) {
      console.error('IremboPay create invoice error:', invoiceResult);
      return Response.json({ error: 'Failed to create invoice' }, { status: 502 });
    }

    const invoiceNumber = invoiceResult.data.invoiceNumber;
    const paymentLinkUrl = invoiceResult.data.paymentLinkUrl;

    // Store IremboPay invoice number on the order (both card and push flows need this)
    await supabase
      .from('orders')
      .update({ irembopay_transaction_id: invoiceNumber })
      .eq('id', orderId);

    // ── Card flow: return paymentLinkUrl, skip push payment ────────────
    if (method === 'card') {
      if (!paymentLinkUrl) {
        console.error('[IremboPay] Invoice missing paymentLinkUrl:', invoiceResult);
        return Response.json({ error: 'Payment link unavailable' }, { status: 502 });
      }
      return Response.json({ paymentLinkUrl });
    }

    // ── Mobile money flow: initiate push payment ──────────────────────
    const pushRes = await fetch(`${BASE_URL}/payments/transactions/initiate`, {
      method: 'POST',
      headers: irembopayHeaders(),
      body: JSON.stringify({
        invoiceNumber,
        accountIdentifier: phone.replace(/\s+/g, ''),
        paymentProvider: method.toUpperCase(),
      }),
    });

    const pushResult = await pushRes.json();

    if (!pushRes.ok || !pushResult.success) {
      console.error('IremboPay push payment error:', pushResult);
      return Response.json({ error: 'Failed to initiate push payment' }, { status: 502 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('Payment initiate error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}