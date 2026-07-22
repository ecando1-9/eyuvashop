'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Coupon } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  coupon: Coupon;
}

export default function AdminCouponRow({ coupon }: Props) {
  const supabase = createClient();
  const [active, setActive] = useState(coupon.is_active);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !active })
        .eq('id', coupon.id);
      if (error) throw error;
      setActive(!active);
      toast.success(`Coupon ${!active ? 'activated' : 'disabled'}`);
    } catch {
      toast.error('Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-3 font-semibold text-orange-600">{coupon.code}</td>
      <td className="px-5 py-3 text-slate-600">{coupon.type === 'percent' ? `${coupon.value}%` : `INR ${coupon.value}`}</td>
      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">INR {coupon.min_order || 0}</td>
      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{coupon.used_count}/{coupon.max_uses || 'Unlimited'}</td>
      <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{coupon.expires_at ? formatDate(coupon.expires_at) : '-'}</td>
      <td className="px-5 py-3">
        <button
          onClick={toggle}
          disabled={loading}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
            active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
        >
          {active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {active ? 'Active' : 'Disabled'}
        </button>
      </td>
    </tr>
  );
}

