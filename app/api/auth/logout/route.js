import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}