import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Step 1: verify the OTP to get a session
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (otpError || !data.session) {
      return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Step 2: update password using the verified session
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Password reset failed' }, { status: 500 });
  }
}