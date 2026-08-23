'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit2, Loader2, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import Image from 'next/image';

export default function BannersAdmin() {
  const supabase = createClient();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ title: '', description: '', image_url: '', cta_text: '', cta_url: '', is_active: true, display_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('display_order');
    if (data) setBanners(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingId) {
        await supabase.from('banners').update(form).eq('id', editingId);
      } else {
        await supabase.from('banners').insert([form]);
      }
      
      setShowModal(false);
      fetchBanners();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    fetchBanners();
  };

  return (
    <AdminLayout title="Hero Banners" subtitle="Manage carousel banners on the home page">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hero Banners</h1>
          <p className="text-sm text-slate-500 mt-1">Manage carousel banners on the home page</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setForm({ title: '', description: '', image_url: '', cta_text: '', cta_url: '', is_active: true, display_order: banners.length + 1 });
            setShowModal(true);
          }}
          className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#e66000]"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-4">Banner</th>
                <th className="p-4">Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Order</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No banners found. Add one to show on the home page.</p>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="relative w-32 h-16 rounded overflow-hidden bg-slate-200">
                        {banner.image_url && <Image src={banner.image_url} alt="banner" fill className="object-cover" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{banner.title || 'Untitled'}</div>
                      {banner.description && <div className="text-xs text-slate-500 line-clamp-1">{banner.description}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {banner.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4">{banner.display_order}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setEditingId(banner.id);
                          setForm({ 
                            title: banner.title || '', 
                            description: banner.description || '', 
                            image_url: banner.image_url, 
                            cta_text: banner.cta_text || '', 
                            cta_url: banner.cta_url || '', 
                            is_active: banner.is_active, 
                            display_order: banner.display_order 
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Banner' : 'New Banner'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL *</label>
                <input 
                  type="url" required
                  placeholder="https://..."
                  value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                />
                <p className="text-[10px] text-slate-500 mt-1">For best results, use an image that is 1200x400 pixels or similar wide format.</p>
              </div>
              
              {form.image_url && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <Image src={form.image_url} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input 
                    type="text"
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <input 
                    type="text"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Text (CTA)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Shop Now"
                    value={form.cta_text} onChange={e => setForm({...form, cta_text: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Link</label>
                  <input 
                    type="text"
                    placeholder="e.g. /categories/fashion"
                    value={form.cta_url} onChange={e => setForm({...form, cta_url: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input 
                    type="number" required
                    value={form.display_order} onChange={e => setForm({...form, display_order: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div className="flex-1 flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
                      className="w-4 h-4 text-[#FF6B00] rounded focus:ring-[#FF6B00]"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active (Visible)</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-lg hover:bg-[#e66000] flex items-center justify-center">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
