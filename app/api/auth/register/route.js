import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

async function provisionUser(supabase, user) {
  // Skip if already provisioned
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();
  
  if (existing) return;

  await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
    role: 'customer',
    password_set: true,
  });
}

export async function POST(request) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password || password.length < 6) {
      return Response.json({ error: 'Email and password (6+ chars) required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const serviceSupabase = createServiceClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password, 
      options: {
        data: { full_name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?confirmed=true`,
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await provisionUser(serviceSupabase, data.user);
    }

    return Response.json({
      success: true,
      message: 'Check your email for verification link (valid 30 min)',
      user: data.user,
      needsEmailConfirmation: !data.session,
    });
  } catch {
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}

