import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.length < 8) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // If number already has + prefix use as-is, otherwise assume Rwanda format
    const intlPhone = cleanPhone.startsWith('+')
      ? cleanPhone
      : '+250' + cleanPhone.slice(1);

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone: intlPhone,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('OTP error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
