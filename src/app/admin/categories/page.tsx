"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle, Grid } from "lucide-react";

export default function AdminCategoriesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', parent_id: '', is_featured: false, display_order: 0 });

  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories')
        .select('*, parent:categories!parent_id(name)')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) fetchCategories();
  }, [user, isAdmin]);

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: formData.description,
        parent_id: formData.parent_id || null,
        is_featured: formData.is_featured,
        display_order: Number(formData.display_order) || 0,
        approval_status: 'approved'
      };

      const { error } = await supabase.from('categories').insert([payload]);
      if (error) throw error;

      setShowModal(false);
      fetchCategories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (authLoading) return null;

  return (
    <AdminLayout 
      title="Product Categories & Structure" 
      subtitle="Organize product taxonomies, hierarchy, and marketplace navigation menus"
      actions={
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">URL Slug</th>
                  <th className="p-4">Parent Group</th>
                  <th className="p-4">Sort Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading categories...</td></tr>
                ) : categories.length > 0 ? (
                  categories.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                          {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-4 w-4 text-slate-400" />}
                        </div>
                        <div>
                          <span>{c.name}</span>
                          {c.is_featured && <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-black px-1.5 py-0.5 rounded-full ml-2">Featured</span>}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{c.slug}</td>
                      <td className="p-4 text-slate-600">{c.parent?.name || 'Root Level'}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">{c.display_order}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.approval_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 ml-1 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
              <h2 className="text-lg font-black text-slate-900">Add New Category</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slug URL (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none font-mono" 
                    value={formData.slug} 
                    onChange={e => setFormData({...formData, slug: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Hierarchy</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none" 
                    value={formData.parent_id} 
                    onChange={e => setFormData({...formData, parent_id: e.target.value})}
                  >
                    <option value="">None (Top Level Root Category)</option>
                    {categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="is_featured"
                    checked={formData.is_featured} 
                    onChange={e => setFormData({...formData, is_featured: e.target.checked})} 
                    className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <label htmlFor="is_featured" className="font-bold text-slate-700 cursor-pointer">Feature on Homepage</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold">
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
