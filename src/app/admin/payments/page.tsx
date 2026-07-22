import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, payment_id, razorpay_order_id, created_at, profile:profiles(first_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Payments</p>
        <h1 className="text-2xl font-semibold text-slate-900">Payment Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">Track transactions, refunds, and payment status.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Payment ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Method</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(payments || []).map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 text-slate-600">{payment.payment_id || payment.razorpay_order_id || '-'}</td>
                  <td className="px-5 py-3 text-orange-600 font-semibold">#{payment.order_number}</td>
                  <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">
                    {payment.profile?.first_name || payment.profile?.email || 'Guest'}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(payment.total)}</td>
                  <td className="px-5 py-3 text-slate-600 hidden md:table-cell">Razorpay</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${payment.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDateTime(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!payments || payments.length === 0) && (
            <div className="text-center py-16 text-slate-400">No payment records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

