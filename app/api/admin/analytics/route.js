import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to check admin role
async function getAdminUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Not found', status: 404 };
  }

  return { user };
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const auth = await getAdminUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    const serviceClient = createServiceClient();

    // Calculate date range
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    let cacheSeconds = 300; // 5 minutes for today
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        cacheSeconds = 1800; // 30 minutes
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        cacheSeconds = 3600; // 1 hour
        break;
      default: // today
        break;
    }

    // Get order stats
    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select('total, status, payment_status, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('payment_status', 'paid');

    if (ordersError) {
      console.error('Analytics error:', ordersError);
      return Response.json({ error: 'Failed to get analytics' }, { status: 500 });
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    // Get status breakdown
    const statusBreakdown = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Get top products
    const { data: orderItems } = await serviceClient
      .from('order_items')
      .select(`
        quantity,
        products:product_id (name, category)
      `)
      .in('order_id', orders.map(o => o.id));

    const productCounts = {};
    const categoryCounts = {};
    
    if (orderItems) {
      orderItems.forEach(item => {
        const name = item.products?.name || 'Unknown';
        const category = item.products?.category || 'Unknown';
        
        productCounts[name] = (productCounts[name] || 0) + item.quantity;
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
      });
    }

    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    const categorySplit = Object.entries(categoryCounts)
      .map(([category, quantity]) => ({ category, quantity }));

    // Apply appropriate cache duration based on period
    const response = Response.json({
      analytics: {
        period,
        totalRevenue,
        orderCount,
        avgOrderValue,
        statusBreakdown,
        topProducts,
        categorySplit,
      }
    });

    response.headers.set('Cache-Control', `private, s-maxage=${cacheSeconds}, stale-while-revalidate=60`);

    return response;
  } catch (err) {
    console.error('Analytics error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

