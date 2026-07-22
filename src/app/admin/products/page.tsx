import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit2, Search, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import AdminProductStatusToggle from './AdminProductStatusToggle';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*, category:categories(name)')
    .order('created_at', { ascending: false });

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`);
  }

  const { data: products } = await query;

  const orderCounts: Record<string, number> = {};
  if (products && products.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .in('product_id', products.map((p) => p.id))
      .limit(5000);

    (orderItems || []).forEach((item) => {
      orderCounts[item.product_id] = (orderCounts[item.product_id] || 0) + (item.quantity || 0);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Catalog Management</p>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage inventory, pricing, and visibility.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-colors"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center">
          <form method="GET" className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="search"
              defaultValue={params.search}
              type="text"
              placeholder="Search products..."
              className="pl-8 text-sm w-full bg-slate-50 border border-slate-200/70 rounded-full"
              style={{ padding: '8px 12px 8px 32px' }}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Orders</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(products || []).map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-48">{product.title}</p>
                        <p className="text-xs text-slate-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">
                    {(product as Product & { category?: { name: string } }).category?.name || '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="font-semibold text-slate-900">{formatCurrency(product.price)}</span>
                      {product.compare_price && (
                        <span className="text-xs text-slate-400 line-through ml-1">
                          {formatCurrency(product.compare_price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      product.stock === 0 ? 'bg-rose-100 text-rose-700' :
                      product.stock <= 5 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-slate-600">
                    {orderCounts[product.id] || 0}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Star size={12} className="text-amber-400" />
                      <span className="text-xs font-semibold">{product.avg_rating ? product.avg_rating.toFixed(1) : '-'}</span>
                      <span className="text-[10px] text-slate-400">({product.review_count || 0})</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <AdminProductStatusToggle productId={product.id} isActive={product.is_active} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!products || products.length === 0) && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">No products found</p>
              <Link href="/admin/products/new" className="text-orange-500 text-sm font-semibold mt-2 inline-block hover:text-orange-700">
                Add your first product
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {products?.length || 0} products</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

