import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) {
      return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    return Response.json({ success: true, user: data.user });
  } catch {
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}