import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Sends a 6-digit OTP to the email for password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // force OTP mode, not magic link
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Always return success (don't reveal if email exists)
    return Response.json({
      success: true,
      message: 'If that email exists, a reset code was sent',
    });
  } catch {
    return Response.json({ error: 'Failed to send reset code' }, { status: 500 });
  }
}