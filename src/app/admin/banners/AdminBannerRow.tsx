'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Banner } from '@/types';

interface Props {
  banner: Banner;
}

export default function AdminBannerRow({ banner }: Props) {
  const supabase = createClient();
  const [active, setActive] = useState(banner.is_active);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !active })
        .eq('id', banner.id);
      if (error) throw error;
      setActive(!active);
      toast.success(`Banner ${!active ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100">
            {banner.image_url && (
              <Image src={banner.image_url} alt={banner.title || 'Banner'} width={64} height={40} className="object-cover" />
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{banner.title || 'Banner'}</p>
            <p className="text-xs text-slate-500">{banner.subtitle || '-'}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{banner.cta_text || '-'}</td>
      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{banner.cta_link || '-'}</td>
      <td className="px-5 py-3 text-slate-600">{banner.position}</td>
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

