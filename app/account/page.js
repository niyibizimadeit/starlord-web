import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountClient from '@/components/AccountClient';

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — send to login page
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  // Fetch profile
  const { data: profile } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch orders with their items
  const { data: orders } = await serviceClient
    .from('orders')
    .select(`
      id,
      reference,
      status,
      payment_status,
      total,
      created_at,
      order_items (
        quantity,
        price_at_time,
        products (
          name,
          image_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <AccountClient
      profile={profile}
      orders={orders || []}
    />
  );
}