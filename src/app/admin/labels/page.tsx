'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProductLabel } from '@/types/database';

export default function AdminLabelsPage() {
  const [labels, setLabels] = useState<ProductLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', color: '#FF6B00' });
  const [submitting, setSubmitting] = useState(false);
  
  const supabase = createClient();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!user && !loading) router.push('/admin');
  }, [user, loading, router]);

  const fetchLabels = async () => {
    setLoading(true);
    const { data } = await supabase.from('product_labels').select('*').order('created_at', { ascending: false });
    if (data) setLabels(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchLabels();
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingId) {
        await supabase.from('product_labels').update(form).eq('id', editingId);
      } else {
        await supabase.from('product_labels').insert([form]);
      }
      
      setShowModal(false);
      fetchLabels();
    } catch (error) {
      alert('Error saving label');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this label?')) return;
    await supabase.from('product_labels').delete().eq('id', id);
    fetchLabels();
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Product Labels</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage labels to highlight products (e.g. Bestseller, Summer Sale)</p>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', color: '#FF6B00' });
              setShowModal(true);
            }}
            className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#e66000]"
          >
            <Plus className="w-4 h-4" /> Create Label
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-4">Label Preview</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Color Hex</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No labels created yet.</td>
                  </tr>
                ) : labels.map((label) => (
                  <tr key={label.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: label.color || '#FF6B00' }}
                      >
                        {label.name}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{label.name}</td>
                    <td className="p-4 font-mono text-slate-500">{label.color}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setEditingId(label.id);
                          setForm({ name: label.name, color: label.color || '#FF6B00' });
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(label.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg">{editingId ? 'Edit Label' : 'New Label'}</h3>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Name (e.g. "Trending") *</label>
                  <input 
                    type="text" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color (Hex format) *</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <input 
                      type="text" required
                      value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                      className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-lg hover:bg-[#e66000] flex items-center justify-center">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Label'}
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
