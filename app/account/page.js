import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountClient from '@/components/AccountClient';

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  const { data: profile } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: orders } = await serviceClient
    .from('orders')
    .select(`
      id, reference, status, payment_status,
      total, delivery_fee, created_at,
      delivery_address,
      order_items (
        quantity, price_at_time,
        products ( name, image_url )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: addresses } = await serviceClient
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  return (
    <AccountClient
      profile={profile}
      orders={orders || []}
      addresses={addresses || []}
      authEmail={user.email || null}
    />
  );
}