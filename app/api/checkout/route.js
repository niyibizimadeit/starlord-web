import { createServiceClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SL-';
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, paymentMethod, idempotencyKey, createAccount } = body;

    if (!items?.length || !customer?.name || !customer?.phone ||
        !customer?.address || !paymentMethod || !idempotencyKey) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    const cleanPhone = customer.phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return Response.json({ error: 'Invalid Rwandan phone number' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── Get logged-in user from session ──────────────────────────────
    let sessionUserId = null;
    try {
      const { cookies } = await import('next/headers');
      const { createServerClient } = await import('@supabase/ssr');
      const cookieStore = await cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (user) sessionUserId = user.id;
    } catch {}

    // ── Check idempotency ─────────────────────────────────────────────
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, reference, status')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingOrder) {
      return Response.json({
        orderId: existingOrder.id,
        reference: existingOrder.reference,
        status: existingOrder.status,
      });
    }

    // ── Fetch delivery fee from settings ──────────────────────────────
    const { data: feeData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_fee')
      .single();
    const DELIVERY_FEE = feeData?.value ? Number(feeData.value) : 0;

    // ── Verify products + stock ───────────────────────────────────────
    const productIds = items.map(i => i.productId);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, price, stock, name')
      .in('id', productIds)
      .eq('is_active', true);

    if (productError || !products?.length) {
      return Response.json({ error: 'Could not verify products' }, { status: 400 });
    }

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return Response.json({ error: 'Product not found' }, { status: 400 });
      if (product.stock < item.quantity) {
        return Response.json({
          error: `${product.name} only has ${product.stock} units left`,
        }, { status: 400 });
      }
    }

    // ── Calculate totals ──────────────────────────────────────────────
    const subtotal = products.reduce((sum, product) => {
      const item = items.find(i => i.productId === product.id);
      return sum + product.price * item.quantity;
    }, 0);
    const total = subtotal + DELIVERY_FEE;

    // ── Sanitise inputs ───────────────────────────────────────────────
    const stripHtml = (str) => str.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim();
    const safeName    = stripHtml(customer.name).slice(0, 100);
    const safeAddress = stripHtml(customer.address).slice(0, 300);

    // ── Resolve user_id ───────────────────────────────────────────────
    // Priority: 1) logged-in session, 2) createAccount flow, 3) null (guest)
    let userId = sessionUserId;

    if (!userId && createAccount) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const intlPhone = '+250' + cleanPhone.slice(1);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: intlPhone,
          phone_confirm: true,
          user_metadata: { full_name: safeName },
        });

        if (!authError && authData.user) {
          const { error: profileError } = await supabase.from('users').insert({
            id:           authData.user.id,
            phone:        cleanPhone,
            full_name:    safeName,
            role:         'customer',
            password_set: false,
          });
          if (!profileError) userId = authData.user.id;
        }
      }
    }

    // ── Create order ──────────────────────────────────────────────────
    const reference = generateReference();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        reference,
        user_id:          userId,
        customer_name:    safeName,
        customer_phone:   cleanPhone,
        delivery_address: safeAddress,
        subtotal,
        delivery_fee:     DELIVERY_FEE,
        total,
        payment_method:   paymentMethod,
        idempotency_key:  idempotencyKey,
        status:           'pending',
        payment_status:   'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', JSON.stringify(orderError));
      return Response.json({ error: 'Could not create order' }, { status: 500 });
    }

    // ── Create order items ────────────────────────────────────────────
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        order_id:      order.id,
        product_id:    item.productId,
        quantity:      item.quantity,
        price_at_time: product.price,
      };
    });
    await supabase.from('order_items').insert(orderItems);

    // ── Deduct stock ──────────────────────────────────────────────────
    const stockResults = await Promise.all(
      items.map(async item => {
        const { data, error } = await supabase.rpc('deduct_stock', {
          p_product_id: item.productId,
          p_quantity:   item.quantity,
        });
        return { productId: item.productId, success: data, error };
      })
    );

    const stockFailed = stockResults.find(r => !r.success || r.error);
    if (stockFailed) {
      await supabase.from('orders').update({ status: 'stock_conflict' }).eq('id', order.id);
      return Response.json({
        error: 'One or more items just sold out. Please review your cart and try again.',
        code:  'STOCK_CONFLICT',
      }, { status: 409 });
    }

    return Response.json({
      orderId:        order.id,
      reference:      order.reference,
      status:         'pending',
      accountCreated: createAccount && !!userId,
    });

  } catch (err) {
    console.error('Checkout error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}