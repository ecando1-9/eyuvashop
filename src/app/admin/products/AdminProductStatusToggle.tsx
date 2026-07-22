'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  productId: string;
  isActive: boolean;
}

export default function AdminProductStatusToggle({ productId, isActive }: Props) {
  const supabase = createClient();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !active, updated_at: new Date().toISOString() })
        .eq('id', productId);
      if (error) throw error;
      setActive(!active);
      toast.success(`Product ${!active ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update product status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
        active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
      }`}
    >
      {active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
      {active ? 'Active' : 'Inactive'}
    </button>
  );
}

