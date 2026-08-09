'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Star, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCartStore';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonProductCard } from '@/components/account/SkeletonLoader';

interface WishlistProduct {
  wishlist_id: string;
  product_id: string;
  added_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number;
    rating: number;
    review_count: number;
    status: string;
    images?: { url: string; is_primary: boolean }[];
    store?: { name: string };
    inventory?: { quantity: number }[];
  };
}

export default function WishlistPage() {
  const { user } = useAuth();
  const addToCart = useCartStore((state) => state.addItem);
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          product:products(
            id, title, price, compare_at_price, rating, review_count, status,
            images:product_images(url, is_primary),
            store:stores(name),
            inventory(quantity)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data || [])
        .filter((item: any) => item.product)
        .map((item: any) => ({
          wishlist_id: item.id,
          product_id: item.product_id,
          added_at: item.created_at,
          product: item.product,
        }));

      setItems(formatted);
    } catch {
      setError('Failed to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId: string) => {
    try {
      setRemovingId(wishlistId);
      const { error: removeError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)
        .eq('user_id', user!.id);

      if (removeError) throw removeError;
      setItems((prev) => prev.filter((i) => i.wishlist_id !== wishlistId));
    } catch {
      alert('Failed to remove item. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (item: WishlistProduct) => {
    try {
      setAddingToCartId(item.wishlist_id);
      // Add to Zustand cart store
      addToCart(item.product as any);
      // Also sync to Supabase cart
      await supabase.from('cart').upsert({
        user_id: user!.id,
        product_id: item.product_id,
        quantity: 1,
      }, { onConflict: 'user_id,product_id,variant_id' });
    } catch {
      // Cart still works via Zustand even if Supabase sync fails
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistProduct) => {
    await handleAddToCart(item);
    await handleRemove(item.wishlist_id);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} saved product{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save products you love and find them here. Never lose track of what you want!"
            actionLabel="Explore Products"
            actionHref="/"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => {
            const product = item.product;
            const image = product.images?.find((i) => i.is_primary)?.url || product.images?.[0]?.url;
            const discount = product.compare_at_price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;
            const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) ?? 0;
            const inStock = totalStock > 0;
            const isRemoving = removingId === item.wishlist_id;
            const isAddingToCart = addingToCartId === item.wishlist_id;

            return (
              <div
                key={item.wishlist_id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group ${
                  isRemoving ? 'opacity-50' : ''
                }`}
              >
                {/* Image */}
                <div className="relative">
                  <Link href={`/products/${product.id}`}>
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        -{discount}%
                      </span>
                    )}
                    {!inStock && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.wishlist_id)}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {product.store && (
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{product.store.name}</p>
                  )}
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#FF6B00] transition-colors leading-tight">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] text-gray-500">{product.rating.toFixed(1)} ({product.review_count})</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.compare_at_price && (
                      <span className="text-xs text-gray-400 line-through">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!inStock || isAddingToCart}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {isAddingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                  {inStock && (
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={isRemoving}
                      className="w-full text-[11px] text-gray-400 hover:text-[#FF6B00] font-semibold transition-colors py-1"
                    >
                      Move to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
