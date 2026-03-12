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

    // Get user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, phone, full_name, email, role, password_set, created_at')
      .eq('id', auth.user.id)
      .single();

    if (error || !profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get addresses
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('is_default', { ascending: false });

    return Response.json({
      profile: {
        id: profile.id,
        phone: profile.phone,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
        passwordSet: profile.password_set,
        createdAt: profile.created_at,
      },
      addresses: addresses || []
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

    const { fullName, email } = await request.json();

    // Update profile
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName.slice(0, 100);
    if (email !== undefined) updates.email = email;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', auth.user.id);

    if (error) {
      console.error('Update profile error:', error);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

