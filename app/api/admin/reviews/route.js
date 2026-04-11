import { createServiceClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET);

async function isAuthorized(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('admin_auth='))
    ?.split('=')[1]
    ?.trim();
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function PATCH(request) {
  try {
    if (!(await isAuthorized(request)))
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
    if (!(await isAuthorized(request)))
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await request.json();
    const supabase = createServiceClient();
    await supabase.from('reviews').delete().eq('id', id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}