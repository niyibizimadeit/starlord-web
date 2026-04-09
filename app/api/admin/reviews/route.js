import { createServiceClient } from '@/lib/supabase/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

// Accepts either the secret header OR the admin cookie
function isAuthorized(request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret && secret === ADMIN_SECRET) return true;

  const cookieHeader = request.headers.get('cookie') || '';
  const adminAuth = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('admin_auth='))
    ?.split('=')[1]
    ?.trim();
  return adminAuth === 'authenticated';
}

export async function PATCH(request) {
  try {
    if (!isAuthorized(request)) 
      return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
    if (!isAuthorized(request))
      return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    const supabase = createServiceClient();
    await supabase.from('reviews').delete().eq('id', id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}