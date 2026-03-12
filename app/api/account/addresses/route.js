import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to check auth and get user
async function getAuthenticatedUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user };
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const auth = await getAuthenticatedUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Get addresses error:', error);
      return Response.json({ error: 'Failed to get addresses' }, { status: 500 });
    }

    return Response.json({ addresses: addresses || [] });
  } catch (err) {
    console.error('Get addresses error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const auth = await getAuthenticatedUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { label, addressLine, isDefault } = await request.json();

    // Validate input
    if (!label || !addressLine) {
      return Response.json({ error: 'Label and address are required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', auth.user.id);
    }

    // Insert address
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: auth.user.id,
        label: label.slice(0, 50),
        address_line: addressLine.slice(0, 300),
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create address error:', error);
      return Response.json({ error: 'Failed to create address' }, { status: 500 });
    }

    return Response.json({ success: true, address: data });
  } catch (err) {
    console.error('Create address error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

