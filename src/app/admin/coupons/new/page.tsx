'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function NewCouponPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    min_order: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast.error('Code and value are required');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        min_order: form.min_order ? Number(form.min_order) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
      };
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) throw error;
      toast.success('Coupon created');
      router.push('/admin/coupons');
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Coupons</p>
        <h1 className="text-2xl font-semibold text-slate-900">Create Coupon</h1>
        <p className="text-sm text-slate-500 mt-1">Create discount codes for marketing campaigns.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Coupon Code</label>
            <input value={form.code} onChange={(e) => set('code', e.target.value)} className="mt-1" placeholder="SAVE20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Discount Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className="mt-1">
              <option value="percent">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Value</label>
            <input value={form.value} onChange={(e) => set('value', e.target.value)} className="mt-1" type="number" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Minimum Order (INR)</label>
            <input value={form.min_order} onChange={(e) => set('min_order', e.target.value)} className="mt-1" type="number" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Usage Limit</label>
            <input value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} className="mt-1" type="number" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Expiry Date</label>
            <input value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} className="mt-1" type="date" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-orange-500" />
          Activate coupon immediately
        </label>

        <button type="submit" disabled={isLoading} className="inline-flex px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white">
          {isLoading ? 'Saving...' : 'Create Coupon'}
        </button>
      </form>
    </div>
  );
}
