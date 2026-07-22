'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { slugify } from '@/lib/utils';
import { Upload, X, Save } from 'lucide-react';
import Image from 'next/image';
import type { Category, Product } from '@/types';

interface Props {
  product: Product;
  categories: Category[];
}

export default function ProductEditForm({ product, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>(product.images || []);

  const [form, setForm] = useState({
    title: product.title || '',
    slug: product.slug || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    compare_price: product.compare_price?.toString() || '',
    stock: product.stock?.toString() || '',
    category_id: product.category_id || '',
    sizes: product.sizes?.join(', ') || '',
    colors: product.colors?.join(', ') || '',
    is_active: product.is_active,
    is_featured: product.is_featured || false,
    is_bestseller: product.is_bestseller || false,
    is_new: product.is_new || false,
    youtube_url: product.youtube_url || '',
  });

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

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
        toast.success('Image uploaded');
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
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock: Number(form.stock) || 0,
        category_id: form.category_id || null,
        sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : null,
        colors: form.colors ? form.colors.split(',').map((c) => c.trim()).filter(Boolean) : null,
        images,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_new: form.is_new,
        youtube_url: form.youtube_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) throw error;
      toast.success('Product updated');
      router.push('/admin/products');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Basic Details</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600">Product Title</label>
              <input
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  set('slug', slugify(e.target.value));
                }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Slug</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">YouTube URL</label>
              <input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Images</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={img} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" sizes="150px" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className={`aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingImage ? (
                  <span className="text-xs text-slate-500">Uploading...</span>
                ) : (
                  <>
                    <Upload size={18} className="text-slate-400 mb-1" />
                    <span className="text-[11px] text-slate-500 font-medium">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Pricing & Stock</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600">Price (INR)</label>
              <input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Compare Price (INR)</label>
              <input value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} type="number" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Stock</label>
              <input value={form.stock} onChange={(e) => set('stock', e.target.value)} type="number" className="mt-1" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Variants</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600">Sizes (comma separated)</label>
              <input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Colors (comma separated)</label>
              <input value={form.colors} onChange={(e) => set('colors', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Category</h2>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Product Flags</h2>
            {[
              { key: 'is_active', label: 'Active' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_bestseller', label: 'Best Seller' },
              { key: 'is_new', label: 'New Arrival' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  className="accent-orange-500"
                />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" disabled={isLoading} className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-2xl text-xs font-semibold">
            <Save size={14} /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
