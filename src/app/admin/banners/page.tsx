import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminBannerRow from './AdminBannerRow';

export default async function AdminBannersPage() {
  const supabase = await createClient();

  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('position', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Homepage Marketing</p>
          <h1 className="text-2xl font-semibold text-slate-900">Banners</h1>
          <p className="text-sm text-slate-500 mt-1">Control hero sliders and promotional banners.</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full"
        >
          <Plus size={14} /> Upload Banner
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Banner</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">CTA Text</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Link</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(banners || []).map((banner) => (
                <AdminBannerRow key={banner.id} banner={banner} />
              ))}
            </tbody>
          </table>
          {(!banners || banners.length === 0) && (
            <div className="text-center py-16 text-slate-400">No banners found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

