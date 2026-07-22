import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';
import AdminOrderRow from './AdminOrderRow';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select('*, profile:profiles(first_name, email), items:order_items(title, quantity)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (params.q) {
    query = query.ilike('order_number', `%${params.q}%`);
  }
  if (params.status && STATUS_OPTIONS.includes(params.status)) {
    query = query.eq('status', params.status);
  }
  if (params.payment && PAYMENT_OPTIONS.includes(params.payment)) {
    query = query.eq('payment_status', params.payment);
  }

  const { data: orders } = await query;

  const totalRevenue = orders?.filter((o) => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Order Management</p>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold text-slate-900">{orders?.length || 0}</span> orders loaded -{' '}
            <span className="font-semibold text-orange-600">{formatCurrency(totalRevenue)}</span> revenue
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
        <form className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search by order ID"
            className="text-sm bg-slate-50 border border-slate-200/70 rounded-full px-4 py-2 w-full md:max-w-xs"
          />
          <select name="status" defaultValue={params.status || ''} className="text-sm bg-slate-50 border border-slate-200/70 rounded-full px-3 py-2 w-full md:w-48">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select name="payment" defaultValue={params.payment || ''} className="text-sm bg-slate-50 border border-slate-200/70 rounded-full px-3 py-2 w-full md:w-48">
            <option value="">All Payments</option>
            {PAYMENT_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 md:ml-auto">
            Apply Filters
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Products</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Delivery</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Order Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders || []).map((order) => (
                <AdminOrderRow key={order.id} order={order as unknown as Order & { profile?: { first_name?: string; email: string } }} />
              ))}
            </tbody>
          </table>
          {(!orders || orders.length === 0) && (
            <div className="text-center py-16 text-slate-400 text-sm">No orders match these filters.</div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {orders?.length || 0} orders</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

