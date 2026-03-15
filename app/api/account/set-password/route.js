import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return Response.json({ error: error.message }, { status: 400 });

    // Mark password as set in users table
    const serviceClient = createServiceClient();
    await serviceClient
      .from('users')
      .update({ password_set: true })
      .eq('id', user.id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}