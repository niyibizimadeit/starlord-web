import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

async function getUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { label, address_line } = await request.json();
    if (!label || !address_line) {
      return Response.json({ error: 'Label and address required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if this is the first address — make it default
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id);

    const isFirst = !existing || existing.length === 0;

    await supabase.from('addresses').insert({
      user_id: user.id,
      label: label.slice(0, 50),
      address_line: address_line.slice(0, 300),
      is_default: isFirst,
    });

    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    return Response.json({ success: true, addresses: addresses || [] });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, label, address_line, is_default } = await request.json();
    const supabase = createServiceClient();

    if (is_default) {
      // Remove default from all others first
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      const updates = {};
      if (label)        updates.label = label.slice(0, 50);
      if (address_line) updates.address_line = address_line.slice(0, 300);
      await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
    }

    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    return Response.json({ success: true, addresses: addresses || [] });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    const supabase = createServiceClient();

    await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id);

    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    return Response.json({ success: true, addresses: addresses || [] });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}