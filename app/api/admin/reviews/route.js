import { createServiceClient } from '@/lib/supabase/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'starlord2024admin';

export async function PATCH(request) {
  try {
    const secret = request.headers.get('x-admin-secret');
    if (secret !== ADMIN_SECRET) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, is_visible } = await request.json();
    const supabase = createServiceClient();
    await supabase.from('reviews').update({ is_visible }).eq('id', id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const secret = request.headers.get('x-admin-secret');
    if (secret !== ADMIN_SECRET) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    const supabase = createServiceClient();
    await supabase.from('reviews').delete().eq('id', id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}