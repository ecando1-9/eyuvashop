import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminCouponRow from './AdminCouponRow';

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Discounts</p>
          <h1 className="text-2xl font-semibold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">Manage promotional codes and usage limits.</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full"
        >
          <Plus size={14} /> Create Coupon
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Discount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Min Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Usage</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Expiry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(coupons || []).map((coupon) => (
                <AdminCouponRow key={coupon.id} coupon={coupon} />
              ))}
            </tbody>
          </table>
          {(!coupons || coupons.length === 0) && (
            <div className="text-center py-16 text-slate-400">No coupons created yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

