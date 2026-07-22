import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AdminShippingPage() {
  const supabase = await createClient();

  const { data: shipments } = await supabase
    .from('orders')
    .select('id, order_number, status, shipping, tracking_number, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Shipping</p>
        <h1 className="text-2xl font-semibold text-slate-900">Shipping Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track delivery status, carriers, and costs.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Courier</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tracking</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Shipping Cost</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Estimated Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(shipments || []).map((order) => {
                const created = new Date(order.created_at);
                const eta = new Date(created);
                eta.setDate(created.getDate() + 5);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 text-orange-600 font-semibold">#{order.order_number}</td>
                    <td className="px-5 py-3 text-slate-600">Manual</td>
                    <td className="px-5 py-3 text-slate-600">{order.tracking_number || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(order.shipping)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{formatDate(eta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!shipments || shipments.length === 0) && (
            <div className="text-center py-16 text-slate-400">No shipping data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

