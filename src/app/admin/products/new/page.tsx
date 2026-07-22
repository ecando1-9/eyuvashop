'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import type { Category } from '@/types';
import { slugify } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    compare_price: '',
    stock: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    is_bestseller: false,
    is_new: true,
    youtube_url: '',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data || []) as Category[]);
    });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setImages((prev) => [...prev, data.url]);
        toast.success('Image uploaded!');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error('Title and price are required');
      return;
    }
    setIsLoading(true);
    try {
      const specsObj = specs.reduce<Record<string, string>>((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value.trim();
        return acc;
      }, {});

      const { data, error } = await supabase
        .from('products')
        .insert({
          title: form.title,
          slug: form.slug || slugify(form.title),
          description: form.description,
          price: parseFloat(form.price),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          stock: parseInt(form.stock) || 0,
          category_id: form.category_id || null,
          images,
          sizes: sizes.length > 0 ? sizes : null,
          colors: colors.length > 0 ? colors : null,
          specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
          is_active: form.is_active,
          is_featured: form.is_featured,
          is_bestseller: form.is_bestseller,
          is_new: form.is_new,
          youtube_url: form.youtube_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Product created!');
      router.push('/admin/products');
    } catch (err) {
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Basic Information</h2>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Product Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => {
                    set('title', e.target.value);
                    set('slug', slugify(e.target.value));
                  }}
                  placeholder="e.g. Premium Cotton T-Shirt"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="auto-generated from title"
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="Describe your product..."
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">YouTube Video URL</label>
                <input
                  type="url"
                  value={form.youtube_url}
                  onChange={(e) => set('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Product Images</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" sizes="150px" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className={`aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploadingImage ? (
                    <span className="text-xs text-gray-500">Uploading...</span>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400 mb-1" />
                      <span className="text-[11px] text-gray-500 font-medium">Upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                </label>
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">Specifications</h2>
                <button
                  type="button"
                  onClick={() => setSpecs((p) => [...p, { key: '', value: '' }])}
                  className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Row
                </button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={spec.key}
                    onChange={(e) => setSpecs((p) => { const n = [...p]; n[i] = { ...n[i], key: e.target.value }; return n; })}
                    placeholder="Property (e.g. Material)"
                    className="flex-1"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    value={spec.value}
                    onChange={(e) => setSpecs((p) => { const n = [...p]; n[i] = { ...n[i], value: e.target.value }; return n; })}
                    placeholder="Value (e.g. Cotton)"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {specs.length === 0 && <p className="text-xs text-gray-400">No specifications added</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Pricing & Stock</h2>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Price (₹) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Compare Price (₹)</label>
                <input type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} placeholder="Original price for discount" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Stock Quantity</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Category</h2>
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Sizes</h2>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {sizes.map((s) => (
                  <span key={s} className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-md">
                    {s}
                    <button type="button" onClick={() => setSizes((p) => p.filter((x) => x !== s))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="S, M, L, XL..."
                  className="flex-1 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSize.trim()) { setSizes((p) => [...p, newSize.trim()]); setNewSize(''); } } }}
                />
                <button
                  type="button"
                  onClick={() => { if (newSize.trim()) { setSizes((p) => [...p, newSize.trim()]); setNewSize(''); } }}
                  className="text-xs bg-orange-100 text-orange-700 font-semibold px-3 rounded-lg hover:bg-orange-200"
                >
                  Add
                </button>
              </div>
              <h2 className="text-sm font-bold text-gray-800 pt-2 border-t border-gray-100">Colors</h2>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {colors.map((c) => (
                  <span key={c} className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-md">
                    {c}
                    <button type="button" onClick={() => setColors((p) => p.filter((x) => x !== c))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Red, Blue..." className="flex-1 text-sm" />
                <button type="button" onClick={() => { if (newColor.trim()) { setColors((p) => [...p, newColor.trim()]); setNewColor(''); } }} className="text-xs bg-orange-100 text-orange-700 font-semibold px-3 rounded-lg hover:bg-orange-200">Add</button>
              </div>
            </div>

            {/* Flags */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <h2 className="text-sm font-bold text-gray-800">Product Tags</h2>
              {[
                { key: 'is_active', label: 'Active (visible to customers)' },
                { key: 'is_featured', label: 'Featured (show in trending)' },
                { key: 'is_bestseller', label: 'Best Seller' },
                { key: 'is_new', label: 'New Arrival' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-orange-200 disabled:opacity-60"
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
