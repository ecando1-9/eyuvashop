import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ArrowUpDown } from 'lucide-react';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true });

  const categoryCounts: Record<string, number> = {};
  if (categories && categories.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('category_id', categories.map((c) => c.id));

    (products || []).forEach((product) => {
      if (product.category_id) {
        categoryCounts[product.category_id] = (categoryCounts[product.category_id] || 0) + 1;
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Catalog Structure</p>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Organize and prioritize categories on the storefront.</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full"
        >
          <Plus size={14} /> Add Category
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Products</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(categories || []).map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                        {category.image_url && (
                          <Image src={category.image_url} alt={category.name} width={40} height={40} className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{category.name}</p>
                        <p className="text-xs text-slate-400">{category.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{category.slug}</td>
                  <td className="px-5 py-3 text-slate-600 font-semibold">{categoryCounts[category.id] || 0}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <ArrowUpDown size={12} /> {category.position}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/categories/edit/${category.id}`} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!categories || categories.length === 0) && (
            <div className="text-center py-16 text-slate-400">No categories found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

