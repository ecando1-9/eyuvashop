'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit2, Loader2, Search, LayoutTemplate } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function HomeSectionsAdmin() {
  const supabase = createClient();
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ title: '', description: '', is_active: true, display_order: 0, linked_category_id: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [manageSection, setManageSection] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [sectionProducts, setSectionProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingProducts, setSavingProducts] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  
  const openManageProducts = async (section: any) => {
    setManageSection(section);
    setSearchQuery('');
    
    // Fetch all products
    const { data: prods } = await supabase.from('products').select('id, title, price, images:product_images(url)').eq('status', 'published');
    if (prods) setAllProducts(prods);
    
    // Fetch current section products
    const { data: secProds } = await supabase.from('home_section_products').select('product_id').eq('section_id', section.id);
    if (secProds) setSectionProducts(secProds.map(sp => sp.product_id));
  };
  
  const saveProducts = async () => {
    if (!manageSection) return;
    setSavingProducts(true);
    
    // Delete existing
    await supabase.from('home_section_products').delete().eq('section_id', manageSection.id);
    
    // Insert new
    if (sectionProducts.length > 0) {
      const inserts = sectionProducts.map((pId, i) => ({
        section_id: manageSection.id,
        product_id: pId,
        display_order: i
      }));
      await supabase.from('home_section_products').insert(inserts);
    }
    
    setSavingProducts(false);
    setManageSection(null);
  };

  const fetchSections = async () => {
    setLoading(true);
    const [secRes, catRes] = await Promise.all([
      supabase.from('home_sections').select('*, category:categories(id, name)').order('display_order'),
      supabase.from('categories').select('id, name').eq('approval_status', 'approved')
    ]);
    if (secRes.data) setSections(secRes.data);
    if (catRes.data) setCategories(catRes.data);
    
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingId) {
        await supabase.from('home_sections').update({ ...form, linked_category_id: form.linked_category_id || null }).eq('id', editingId);
      } else {
        await supabase.from('home_sections').insert([{ ...form, linked_category_id: form.linked_category_id || null }]);
      }
      
      setShowModal(false);
      fetchSections();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    await supabase.from('home_sections').delete().eq('id', id);
    fetchSections();
  };

  return (
    <AdminLayout title="Home Sections" subtitle="Manage custom product collections on the home page">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Sections</h1>
          <p className="text-sm text-slate-500 mt-1">Manage custom product collections on the home page</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setForm({ title: '', description: '', is_active: true, display_order: sections.length + 1, linked_category_id: '' });
            setShowModal(true);
          }}
          className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#e66000]"
        >
          <Plus className="w-4 h-4" /> Create Section
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Order</th>
                <th className="p-4">Linked Category</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No home sections found. Create one to feature products on the home page.</p>
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr key={section.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{section.title}</div>
                      {section.description && <div className="text-xs text-slate-500">{section.description}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${section.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {section.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4">{section.display_order}</td>
                    <td className="p-4">
                      {section.category ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Auto: {section.category.name}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Manual</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => openManageProducts(section)}
                        className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-bold mr-2"
                      >
                        Manage Products
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(section.id);
                          setForm({ title: section.title, description: section.description || '', is_active: section.is_active, display_order: section.display_order, linked_category_id: section.linked_category_id || '' });
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(section.id)}
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

      
      {manageSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 py-10">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Manage Products: {manageSection.title}</h3>
              <button onClick={() => setManageSection(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allProducts.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase())).map(product => {
                  const isSelected = sectionProducts.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => {
                        if (isSelected) setSectionProducts(prev => prev.filter(id => id !== product.id));
                        else setSectionProducts(prev => [...prev, product.id]);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#FF6B00] bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 text-[#FF6B00] rounded focus:ring-[#FF6B00]" />
                      <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                        {product.images?.[0]?.url && <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{product.title}</p>
                        <p className="text-xs text-slate-500">₹{product.price}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-600">{sectionProducts.length} products selected</span>
              <div className="flex gap-3">
                <button onClick={() => setManageSection(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={saveProducts} disabled={savingProducts} className="px-6 py-2 bg-[#FF6B00] text-white font-bold rounded-lg hover:bg-[#e66000] flex items-center justify-center">
                  {savingProducts ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Section' : 'New Home Section'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title (e.g. "For Women") *</label>
                <input 
                  type="text" required
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (optional)</label>
                <input 
                  type="text"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
              
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link Category (Auto-populate) - Optional</label>
                  <select
                    value={form.linked_category_id}
                    onChange={e => setForm({...form, linked_category_id: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#FF6B00] bg-white"
                  >
                    <option value="">-- Manual Assignment --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">If a category is linked, products from this category are automatically added to this section.</p>
                </div>

                <div className="flex gap-4">
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
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Section'}
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
