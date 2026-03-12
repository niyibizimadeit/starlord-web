import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return Response.json({ error: 'Phone and OTP code required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const intlPhone  = '+250' + cleanPhone.slice(1);

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone: intlPhone,
      token,
      type: 'sms',
    });

    if (error) {
      return Response.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 });
    }

    // Ensure a users profile record exists for this auth user
    if (data.user) {
      const serviceClient = createServiceClient();

      const { data: existingProfile } = await serviceClient
        .from('users')
        .select('id, full_name, password_set')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // First time logging in via OTP — create profile
        await serviceClient.from('users').insert({
          id:           data.user.id,
          phone:        cleanPhone,
          role:         'customer',
          password_set: false,
        });
      }

      return Response.json({
        success:     true,
        userId:      data.user.id,
        hasName:     !!existingProfile?.full_name,
        passwordSet: existingProfile?.password_set ?? false,
      });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}