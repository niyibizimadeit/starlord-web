import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password || password.length < 6) {
      return Response.json({ error: 'Email and password (6+ chars) required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Supabase returns empty identities array for already-registered emails
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return Response.json({ error: 'account_exists' }, { status: 409 });
    }

    return Response.json({
      success: true,
      message: 'Check your email for your verification code',
      needsEmailConfirmation: !data.session,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}