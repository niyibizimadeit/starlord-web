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

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
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

    // Check ownership before deleting
    const { data: address, error: fetchError } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !address) {
      return Response.json({ error: 'Address not found' }, { status: 404 });
    }

    // VULN-15: Ownership check
    if (address.user_id !== auth.user.id) {
      return Response.json({ error: 'Not found' }, { status: 404 }); // Don't reveal existence
    }

    const { error: deleteError } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete address error:', deleteError);
      return Response.json({ error: 'Failed to delete address' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    console.error('Delete address error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

