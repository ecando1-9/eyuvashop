import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('profiles')
    .select('id, first_name, email, created_at')
    .eq('id', params.id)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/admin/customers" className="text-sm text-orange-600">Back to Customers</Link>
        <p className="text-slate-500">Customer not found.</p>
      </div>
    );
  }

  const totalSpent = (orders || []).reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Customer Profile</p>
          <h1 className="text-2xl font-semibold text-slate-900">{customer.first_name || 'Customer'}</h1>
          <p className="text-sm text-slate-500">{customer.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total Orders</p>
          <p className="text-lg font-semibold text-slate-900">{orders?.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total Spent</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <p className="text-xs text-slate-500">Joined</p>
          <p className="text-lg font-semibold text-slate-900">{formatDateTime(customer.created_at)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders || []).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 text-orange-600 font-semibold">#{order.order_number}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3 text-slate-500">{order.status}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{formatDateTime(order.created_at)}</td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td className="px-5 py-6 text-slate-400" colSpan={4}>No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

