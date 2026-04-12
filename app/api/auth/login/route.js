import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Login]', error.message); // internal only
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      session: data.session,
      user: data.user 
    });
  } catch {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}

