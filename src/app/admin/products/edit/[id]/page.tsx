import { createClient } from '@/lib/supabase/server';
import ProductEditForm from '../../ProductEditForm';
import type { Category, Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).single(),
    supabase.from('categories').select('*').order('name'),
  ]);

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-slate-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Products</p>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Product</h1>
        <p className="text-sm text-slate-500 mt-1">Update product details, pricing, and inventory.</p>
      </div>

      <ProductEditForm product={product as Product} categories={(categories || []) as Category[]} />
    </div>
  );
}
