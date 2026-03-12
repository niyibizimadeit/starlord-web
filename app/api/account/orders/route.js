import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user };
}

// Protected: returns all orders for the authenticated user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      },
    );

    const auth = await getAuthenticatedUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, reference, status, payment_status, total, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get account orders error:', error);
      return Response.json({ error: 'Failed to get orders' }, { status: 500 });
    }

    return Response.json({ orders: orders || [] });
  } catch (err) {
    console.error('Get account orders error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

