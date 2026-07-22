'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWishlistStore } from '@/lib/wishlist-store';
import type { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { items: wishlistIds, removeItem } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistIds.length === 0) { setIsLoading(false); return; }
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .in('id', wishlistIds)
        .eq('is_active', true);
      setProducts((data || []) as Product[]);
      setIsLoading(false);
    };
    fetchProducts();
  }, [wishlistIds.join(',')]);

  if (!isLoading && wishlistIds.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-black text-gray-900">My Wishlist</h1>
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Heart size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 text-sm mb-6">Save products you like and find them here anytime.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">My Wishlist</h1>
        <span className="text-sm text-gray-500">{wishlistIds.length} items</span>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
