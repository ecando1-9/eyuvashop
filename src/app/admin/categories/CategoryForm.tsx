'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    position?: number | null;
  };
}

export default function CategoryForm({ mode, initialData }: CategoryFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    position: initialData?.position?.toString() || '0',
  });

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

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
        set('image_url', data.url);
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
    if (!form.name) {
      toast.error('Category name is required');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        image_url: form.image_url || null,
        position: Number(form.position) || 0,
      };

      if (mode === 'create') {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        toast.success('Category created');
      } else if (initialData?.id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Category updated');
      }

      router.push('/admin/categories');
    } catch {
      toast.error('Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Category Name</label>
          <input
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value);
              set('slug', slugify(e.target.value));
            }}
            placeholder="e.g. Accessories"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Display Order</label>
          <input type="number" value={form.position} onChange={(e) => set('position', e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Category Icon / Image URL</label>
          <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://" />
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 cursor-pointer">
          <Upload size={14} />
          {uploadingImage ? 'Uploading...' : 'Upload Image'}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white"
      >
        {isLoading ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Save Changes'}
      </button>
    </form>
  );
}
