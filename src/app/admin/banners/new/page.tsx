'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function NewBannerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    position: '0',
    is_active: true,
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
    if (!form.image_url) {
      toast.error('Banner image is required');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        title: form.title || null,
        subtitle: form.subtitle || null,
        image_url: form.image_url,
        cta_text: form.cta_text || null,
        cta_link: form.cta_link || null,
        position: Number(form.position) || 0,
        is_active: form.is_active,
      };
      const { error } = await supabase.from('banners').insert(payload);
      if (error) throw error;
      toast.success('Banner created');
      router.push('/admin/banners');
    } catch {
      toast.error('Failed to create banner');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Banners</p>
        <h1 className="text-2xl font-semibold text-slate-900">Upload Banner</h1>
        <p className="text-sm text-slate-500 mt-1">Manage homepage sliders and marketing banners.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Subtitle</label>
            <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">CTA Text</label>
            <input value={form.cta_text} onChange={(e) => set('cta_text', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">CTA Link</label>
            <input value={form.cta_link} onChange={(e) => set('cta_link', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Position</label>
            <input value={form.position} onChange={(e) => set('position', e.target.value)} className="mt-1" type="number" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-slate-600">Banner Image URL</label>
          <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://" />
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 cursor-pointer">
            <Upload size={14} />
            {uploadingImage ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-orange-500" />
          Enable banner immediately
        </label>

        <button type="submit" disabled={isLoading} className="inline-flex px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white">
          {isLoading ? 'Saving...' : 'Create Banner'}
        </button>
      </form>
    </div>
  );
}
