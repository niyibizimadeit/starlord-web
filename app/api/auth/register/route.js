import { createServerSupabaseClient } from '@/lib/supabase/server';

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
      return Response.json({ error: 'Registration failed. Please try again.' }, { status: 400 });
    }

    // Note: Supabase's signUp returns { data.session: null } for already-registered emails.
    // We intentionally don't reveal whether the email exists — see forgot-password for the same pattern.

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