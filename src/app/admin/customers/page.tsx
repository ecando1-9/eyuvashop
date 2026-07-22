import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('profiles')
    .select('id, first_name, email, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(200);

  const spending: Record<string, { count: number; total: number }> = {};
  if (customers && customers.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, total')
      .in('user_id', customers.map((c) => c.id));

    (orders || []).forEach((order) => {
      if (!order.user_id) return;
      const current = spending[order.user_id] || { count: 0, total: 0 };
      spending[order.user_id] = {
        count: current.count + 1,
        total: current.total + (order.total || 0),
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Customer Management</p>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">Track loyalty, spending, and account health.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Orders</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total Spent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(customers || []).map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {customer.first_name || 'Customer'}
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{customer.email}</td>
                  <td className="px-5 py-3 text-slate-600 font-semibold">{spending[customer.id]?.count || 0}</td>
                  <td className="px-5 py-3 text-slate-600 font-semibold">
                    {formatCurrency(spending[customer.id]?.total || 0)}
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{formatDate(customer.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Active</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/customers/${customer.id}`} className="text-xs font-semibold text-slate-600 hover:text-orange-600">
                        View
                      </Link>
                      <button className="text-xs font-semibold text-rose-500" disabled title="Connect to account status field">
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!customers || customers.length === 0) && (
            <div className="text-center py-16 text-slate-400">No customers yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

