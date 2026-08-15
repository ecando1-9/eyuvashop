"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

export default function AdminCategoriesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', parent_id: '', is_featured: false, display_order: 0 });

  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
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
        display_order: formData.display_order,
        approval_status: 'approved' // Auto approve admin created
      };

      const { error } = await supabase.from('categories').insert(payload);
      if (error) throw error;
      setShowModal(false);
      fetchCategories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (authLoading || loading) return <div className="p-6">Loading categories...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#FF6B00] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Parent</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                    {c.image_url ? <img src={c.image_url} className="w-full h-full object-cover rounded" /> : <ImageIcon className="h-4 w-4 text-gray-400" />}
                  </div>
                  {c.name} {c.is_featured && <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded ml-2">Featured</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">{c.slug}</td>
                <td className="px-6 py-4 text-gray-500">{c.parent?.name || '-'}</td>
                <td className="px-6 py-4">{c.display_order}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${c.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {c.approval_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit2 className="h-4 w-4" /></button>
                  <button className="text-red-600 p-1 hover:bg-red-50 rounded ml-2"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Add Category</h2>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1">Name</label><input type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Slug (optional)</label><input type="text" className="w-full border rounded p-2" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
              <div>
                <label className="block text-sm mb-1">Parent Category</label>
                <select className="w-full border rounded p-2" value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})}>
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                <label className="text-sm">Is Featured</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#FF6B00] text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
