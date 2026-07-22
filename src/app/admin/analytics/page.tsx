import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

const AdminDashboardCharts = dynamic(() => import('../components/AdminDashboardCharts'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start14Days = new Date(today);
  start14Days.setDate(start14Days.getDate() - 13);
  const start12Months = new Date(today);
  start12Months.setMonth(start12Months.getMonth() - 11);
  start12Months.setDate(1);

  const [
    revenueResult,
    ordersCountResult,
    dailyOrdersResult,
    monthlyOrdersResult,
    customerGrowthResult,
    topItemsResult,
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total, created_at').eq('payment_status', 'paid').gte('created_at', start14Days.toISOString()),
    supabase.from('orders').select('total, created_at').eq('payment_status', 'paid').gte('created_at', start12Months.toISOString()),
    supabase.from('profiles').select('created_at').eq('role', 'customer').gte('created_at', start12Months.toISOString()),
    supabase.from('order_items').select('product_id, quantity, product:products(title)').limit(2000),
  ]);

  const totalRevenue = revenueResult.data?.reduce((sum, o) => sum + o.total, 0) || 0;
  const totalOrders = ordersCountResult.count || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailyTotals = new Map<string, { revenue: number; orders: number }>();
  (dailyOrdersResult.data || []).forEach((order) => {
    const date = new Date(order.created_at);
    const key = date.toISOString().slice(0, 10);
    const current = dailyTotals.get(key) || { revenue: 0, orders: 0 };
    dailyTotals.set(key, {
      revenue: current.revenue + (order.total || 0),
      orders: current.orders + 1,
    });
  });

  const dailySales = Array.from({ length: 14 }).map((_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (13 - index));
    const key = day.toISOString().slice(0, 10);
    const value = dailyTotals.get(key) || { revenue: 0, orders: 0 };
    return {
      date: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: value.revenue,
      orders: value.orders,
    };
  });

  const monthlyTotals = new Map<string, number>();
  (monthlyOrdersResult.data || []).forEach((order) => {
    const date = new Date(order.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + (order.total || 0));
  });

  const monthlyRevenue = Array.from({ length: 12 }).map((_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: monthDate.toLocaleDateString('en-IN', { month: 'short' }),
      revenue: monthlyTotals.get(key) || 0,
    };
  });

  const customerTotals = new Map<string, number>();
  (customerGrowthResult.data || []).forEach((row) => {
    const date = new Date(row.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    customerTotals.set(key, (customerTotals.get(key) || 0) + 1);
  });

  const customerGrowth = Array.from({ length: 12 }).map((_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: monthDate.toLocaleDateString('en-IN', { month: 'short' }),
      customers: customerTotals.get(key) || 0,
    };
  });

  const topProductMap = new Map<string, { name: string; sold: number }>();
  (topItemsResult.data || []).forEach((item) => {
    const product = item.product as { title?: string } | null;
    const name = product?.title || 'Unknown';
    const existing = topProductMap.get(item.product_id) || { name, sold: 0 };
    topProductMap.set(item.product_id, { name: existing.name, sold: existing.sold + (item.quantity || 0) });
  });

  const topProducts = Array.from(topProductMap.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Analytics</p>
        <h1 className="text-2xl font-semibold text-slate-900">Sales Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Review revenue trends and customer growth.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Orders</p>
          <p className="text-lg font-semibold text-slate-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Avg. Order Value</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(avgOrderValue)}</p>
        </div>
      </div>

      <AdminDashboardCharts
        dailySales={dailySales}
        monthlyRevenue={monthlyRevenue}
        topProducts={topProducts}
        customerGrowth={customerGrowth}
      />
    </div>
  );
}

