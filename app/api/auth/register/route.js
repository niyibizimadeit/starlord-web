import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

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
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Check if already provisioned
      const { data: existing } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        const { error: insertError } = await serviceSupabase
          .from('users')
          .insert({
            id:           data.user.id,
            email:        data.user.email,
            full_name:    full_name || email.split('@')[0],
            phone:        null,   // ← explicitly null for email registrations
            role:         'customer',
            password_set: true,
          });

        if (insertError) {
          console.error('User provision error:', JSON.stringify(insertError));
          // Don't block registration — user can still verify and log in
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Check your email for your verification code',
      needsEmailConfirmation: !data.session,
    });
  } catch {
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}