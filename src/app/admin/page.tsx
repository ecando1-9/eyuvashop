import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate, formatDateTime, pluralize } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  UserPlus,
  Clock,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Star,
} from 'lucide-react';

const AdminDashboardCharts = dynamic(() => import('./components/AdminDashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm">
      <div className="h-60 skeleton" />
    </div>
  ),
});

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  tracking_number?: string | null;
  profile?: { first_name?: string; email: string } | null;
  items?: { title: string; quantity: number }[] | null;
};

type ProductStock = {
  id: string;
  title: string;
  stock: number;
  is_active: boolean;
};

export default async function AdminDashboard() {
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
    usersCountResult,
    productsCountResult,
    newUsersResult,
    pendingOrdersResult,
    recentOrdersResult,
    dailyOrdersResult,
    monthlyOrdersResult,
    customerGrowthResult,
    lowStockResult,
    topItemsResult,
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', today.toISOString()),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, created_at, tracking_number, items:order_items(title, quantity), profile:profiles(first_name, email)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start14Days.toISOString()),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start12Months.toISOString()),
    supabase
      .from('profiles')
      .select('created_at')
      .eq('role', 'customer')
      .gte('created_at', start12Months.toISOString()),
    supabase
      .from('products')
      .select('id, title, stock, is_active')
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(6),
    supabase
      .from('order_items')
      .select('product_id, quantity, product:products(title)')
      .limit(2000),
  ]);

  const totalRevenue = revenueResult.data?.reduce((sum, o) => sum + o.total, 0) || 0;
  const totalOrders = ordersCountResult.count || 0;
  const totalUsers = usersCountResult.count || 0;
  const totalProducts = productsCountResult.count || 0;
  const newUsersToday = newUsersResult.count || 0;
  const pendingOrders = pendingOrdersResult.count || 0;

  const recentOrders = (recentOrdersResult.data || []) as OrderSummary[];
  const lowStock = (lowStockResult.data || []) as ProductStock[];

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    packed: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    refunded: 'bg-slate-200 text-slate-700',
  };

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      tone: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      hint: 'Paid orders only',
      href: '/admin/analytics',
    },
    {
      label: 'Total Orders',
      value: String(totalOrders),
      icon: ShoppingBag,
      tone: 'text-blue-600 bg-blue-50 border-blue-100',
      hint: 'All time',
      href: '/admin/orders',
    },
    {
      label: 'Total Customers',
      value: String(totalUsers),
      icon: Users,
      tone: 'text-violet-600 bg-violet-50 border-violet-100',
      hint: 'Registered buyers',
      href: '/admin/customers',
    },
    {
      label: 'Total Products',
      value: String(totalProducts),
      icon: Package,
      tone: 'text-orange-600 bg-orange-50 border-orange-100',
      hint: 'Active catalog',
      href: '/admin/products',
    },
    {
      label: 'New Users Today',
      value: String(newUsersToday),
      icon: UserPlus,
      tone: 'text-teal-600 bg-teal-50 border-teal-100',
      hint: 'Since midnight',
      href: '/admin/customers',
    },
    {
      label: 'Pending Orders',
      value: String(pendingOrders),
      icon: Clock,
      tone: 'text-amber-600 bg-amber-50 border-amber-100',
      hint: 'Needs action',
      href: '/admin/orders',
    },
  ];

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

  const lowStockCount = lowStock.filter((p) => p.stock > 0).length;
  const outOfStockCount = lowStock.filter((p) => p.stock === 0).length;

  const notifications = [
    {
      title: 'Pending orders need attention',
      detail: `${pendingOrders} orders waiting for confirmation`,
      icon: Clock,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'New review posted',
      detail: 'Check review queue for approval',
      icon: Star,
      tone: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Inventory warning',
      detail: `${lowStockCount} low stock, ${outOfStockCount} out of stock`,
      icon: AlertTriangle,
      tone: 'bg-rose-50 text-rose-700',
    },
    {
      title: 'New customers today',
      detail: `${newUsersToday} new signups`,
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Admin Overview</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor sales, operations, and growth signals in real time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/reports"
            className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
          >
            Download Reports
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
          >
            Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.tone}`}>
                <card.icon size={18} />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{card.hint}</span>
            </div>
            <p className="text-xl font-semibold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1 group-hover:text-orange-500 transition-colors">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <AdminDashboardCharts
        dailySales={dailySales}
        monthlyRevenue={monthlyRevenue}
        topProducts={topProducts}
        customerGrowth={customerGrowth}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Latest Orders</p>
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-orange-600">#{order.order_number}</td>
                    <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">
                      {order.profile?.first_name || order.profile?.email || 'Guest'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                      {(order.items || []).slice(0, 2).map((item, index) => (
                        <span key={`${order.id}-${index}`} className="block">
                          {item.title} x {item.quantity}
                        </span>
                      ))}
                      {(order.items || []).length > 2 && (
                        <span className="text-xs text-slate-400">+{(order.items || []).length - 2} more</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-sm text-slate-400" colSpan={6}>
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Notifications</p>
                <h3 className="text-lg font-semibold text-slate-900">Alerts & Updates</h3>
              </div>
              <BellPlus />
            </div>
            <div className="space-y-3">
              {notifications.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.tone}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Inventory</p>
                <h3 className="text-lg font-semibold text-slate-900">Stock Alerts</h3>
              </div>
              <Link href="/admin/products" className="text-xs font-semibold text-orange-600">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{product.title}</p>
                    <p className="text-xs text-slate-500">
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                    product.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {product.stock === 0 ? 'Critical' : 'Low'}
                  </span>
                </div>
              ))}
              {lowStock.length === 0 && (
                <p className="text-sm text-slate-400">All products are well stocked.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Business Insights</p>
              <h3 className="text-lg font-semibold text-slate-900">Profit Snapshot</h3>
            </div>
            <Sparkles className="text-orange-500" size={18} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Avg. Order Value</p>
              <p className="text-lg font-semibold text-slate-900">
                {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Pending Orders</p>
              <p className="text-lg font-semibold text-slate-900">{pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Customer Repeat Rate</p>
              <p className="text-lg font-semibold text-slate-900">--</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Margin Tracker</p>
              <p className="text-lg font-semibold text-slate-900">Add cost data</p>
            </div>
          </div>
          <Link href="/admin/business-insights" className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-orange-600">
            Open Business Insights <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Security & Activity</p>
              <h3 className="text-lg font-semibold text-slate-900">Admin Logs</h3>
            </div>
            <ShieldCheck className="text-emerald-500" size={18} />
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
              <ClipboardList className="text-slate-400" size={16} />
              <div>
                <p className="font-semibold text-slate-800">Order status updates</p>
                <p className="text-xs text-slate-500">{pluralize(pendingOrders, 'order')} updated today</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
              <ShieldCheck className="text-slate-400" size={16} />
              <div>
                <p className="font-semibold text-slate-800">Secure access enabled</p>
                <p className="text-xs text-slate-500">Role-based access control active</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
              <Sparkles className="text-slate-400" size={16} />
              <div>
                <p className="font-semibold text-slate-800">New report generated</p>
                <p className="text-xs text-slate-500">Revenue summary ready to export</p>
              </div>
            </div>
          </div>
          <Link href="/admin/reports" className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-orange-600">
            View reports <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function BellPlus() {
  return (
    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
      <Sparkles size={16} />
    </div>
  );
}
