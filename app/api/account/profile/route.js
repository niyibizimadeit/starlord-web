import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

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

    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();

    const { data: profile, error } = await serviceSupabase
      .from('users')
      .select('id, phone, full_name, email, role, password_set, created_at')
      .eq('id', auth.user.id)
      .single();

    if (error || !profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: addresses } = await serviceSupabase
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

    const { fullName, email, phone } = await request.json();

    // Update profile
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName.slice(0, 100);
    if (email !== undefined) updates.email = email;
    if (phone !== undefined && phone) {
      let cleanPhone = phone.replace(/\s/g, '');
      // Normalize +250 prefix to local format
      if (cleanPhone.startsWith('+250')) cleanPhone = '0' + cleanPhone.slice(4);
      if (cleanPhone.startsWith('250'))  cleanPhone = '0' + cleanPhone.slice(3);
      const phoneRegex = /^(078|079|072|073)\d{7}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return Response.json({ error: 'Enter a valid Rwandan phone number' }, { status: 400 });
      }
      updates.phone = cleanPhone;
    }

    const serviceSupabase = createServiceClient();
    const { error } = await serviceSupabase
      .from('users')
      .update(updates)
      .eq('id', auth.user.id);

    if (error) {
      console.error('Update profile error:', error);
      if (error.code === '23505' && error.details?.includes('phone')) {
        return Response.json({ error: 'This phone number is already linked to another account' }, { status: 400 });
      }
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

