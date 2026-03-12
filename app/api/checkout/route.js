import { createServiceClient } from '@/lib/supabase/server';
import DOMPurify from 'isomorphic-dompurify';

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

    // ── 1. Validate required fields ──────────────────────────────────
    if (!items?.length || !customer?.name || !customer?.phone ||
        !customer?.address || !paymentMethod || !idempotencyKey) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── 2. Validate Rwandan phone number ─────────────────────────────
    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    const cleanPhone = customer.phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return Response.json({ error: 'Invalid Rwandan phone number' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── 3. Check idempotency — prevent duplicate orders ───────────────
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

    // ── 4. Recalculate prices from DB — never trust client ────────────
    const productIds = items.map(i => i.productId);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, price, stock, name')
      .in('id', productIds)
      .eq('is_active', true);

    if (productError || !products?.length) {
      return Response.json({ error: 'Could not verify products' }, { status: 400 });
    }

    // ── 5. Check stock for every item ─────────────────────────────────
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return Response.json({ error: 'Product not found' }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return Response.json({
          error: `${product.name} only has ${product.stock} units left`,
        }, { status: 400 });
      }
    }

    // ── 6. Calculate totals server-side ───────────────────────────────
    const DELIVERY_FEE = 2000;
    const subtotal = products.reduce((sum, product) => {
      const item = items.find(i => i.productId === product.id);
      return sum + product.price * item.quantity;
    }, 0);
    const total = subtotal + DELIVERY_FEE;

    // ── 7. Sanitise free-text inputs ──────────────────────────────────
    const safeName    = DOMPurify.sanitize(customer.name).slice(0, 100);
    const safeAddress = DOMPurify.sanitize(customer.address).slice(0, 300);

    // ── 8. Handle account creation BEFORE order so we have user_id ───
    let userId = null;

    if (createAccount) {
      // Check if an account already exists for this phone number
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingUser) {
        // Account already exists — link this order to it
        userId = existingUser.id;
      } else {
        // Format phone for Supabase Auth: 0788123456 → +250788123456
        const intlPhone = '+250' + cleanPhone.slice(1);

        // Create Supabase Auth user (no OTP sent — account created silently)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: intlPhone,
          phone_confirm: true, // mark phone as verified since they just checked out
          user_metadata: { full_name: safeName },
        });

        if (!authError && authData.user) {
          // Create the users profile record
          const { error: profileError } = await supabase.from('users').insert({
            id:           authData.user.id,
            phone:        cleanPhone,
            full_name:    safeName,
            role:         'customer',
            password_set: false,
          });

          if (!profileError) {
            userId = authData.user.id;
          }
        }
        // If account creation fails for any reason, we do NOT block the order
        // The customer still gets their order — account creation is best-effort
      }
    }

    // ── 9. Create ORDER record ────────────────────────────────────────
    const reference = generateReference();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        reference,
        user_id:          userId,       // null for guests, set for account holders
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
      return Response.json({ error: 'Could not create order' }, { status: 500 });
    }


    // ── 10. Create ORDER_ITEMS records ────────────────────────────────
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

    // ── 11. Deduct stock atomically for every item ────────────────────
    const stockResults = await Promise.all(
      items.map(async item => {
        const { data, error } = await supabase.rpc('deduct_stock', {
          p_product_id: item.productId,
          p_quantity:   item.quantity,
        });
        return { productId: item.productId, success: data, error };
      })
    );

    // Check if any item failed stock deduction (race condition — someone else bought last unit)
    const stockFailed = stockResults.find(r => !r.success || r.error);

    if (stockFailed) {
      // Mark order as stock_conflict so admin is alerted
      await supabase
        .from('orders')
        .update({ status: 'stock_conflict' })
        .eq('id', order.id);

      return Response.json({
        error: 'One or more items just sold out. Please review your cart and try again.',
        code:  'STOCK_CONFLICT',
      }, { status: 409 });
    }

    // ── 12. IremboPay call placeholder ────────────────────────────────
    // const paymentResponse = await callIremboPay({ amount: total, ... });

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