'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  History,
  ShoppingCart,
  Star,
  Heart,
  Trash2,
  ShoppingBag,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCartStore';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonProductCard } from '@/components/account/SkeletonLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentlyViewedProduct {
  id: string;
  viewed_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number;
    rating: number;
    review_count: number;
    images?: { url: string; is_primary: boolean }[];
    store?: { name: string };
    inventory?: { quantity: number }[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDiscount(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function getTotalStock(inventory?: { quantity: number }[]): number {
  return inventory?.reduce((sum, inv) => sum + inv.quantity, 0) ?? 0;
}

function getPrimaryImage(images?: { url: string; is_primary: boolean }[]): string | null {
  if (!images || images.length === 0) return null;
  return images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null;
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmClearModal({ isOpen, onConfirm, onCancel, loading }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-gray-900">Clear All History?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This will permanently remove all recently viewed products from your history. This action
            cannot be undone.
          </p>
        </div>
        <div className="flex w-full gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Clearing…
              </>
            ) : (
              'Clear All'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

interface ProductCardProps {
  item: RecentlyViewedProduct;
  onRemove: (id: string) => void;
  onAddToCart: (item: RecentlyViewedProduct) => void;
  onToggleWishlist: (productId: string) => void;
  isRemoving: boolean;
  isAddingToCart: boolean;
  isWishlisting: boolean;
  wishlistedIds: Set<string>;
}

function ProductCard({
  item,
  onRemove,
  onAddToCart,
  onToggleWishlist,
  isRemoving,
  isAddingToCart,
  isWishlisting,
  wishlistedIds,
}: ProductCardProps) {
  const { product } = item;
  const image = getPrimaryImage(product.images);
  const discount = getDiscount(product.price, product.compare_at_price);
  const inStock = getTotalStock(product.inventory) > 0;
  const isWishlisted = wishlistedIds.has(product.id);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group ${
        isRemoving ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* ---- Image Area ---- */}
      <div className="relative">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative h-44 bg-gray-100 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {discount > 0 && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              Out of Stock
            </span>
          )}
        </div>

        {/* Action buttons on image */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {/* Wishlist */}
          <button
            onClick={() => onToggleWishlist(product.id)}
            disabled={isWishlisting}
            className={`w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-colors ${
              isWishlisted
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            } disabled:opacity-50`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className="w-4 h-4 transition-colors"
              fill={isWishlisted ? 'currentColor' : 'none'}
            />
          </button>

          {/* Remove from history */}
          <button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors disabled:opacity-50"
            aria-label="Remove from history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---- Info Area ---- */}
      <div className="p-3 space-y-1.5">
        {/* Store name */}
        {product.store && (
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate">
            {product.store.name}
          </p>
        )}

        {/* Title */}
        <Link href={`/products/${product.id}`}>
          <h3 className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#FF6B00] transition-colors leading-tight">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-500">
              {product.rating.toFixed(1)}
              <span className="text-gray-400"> ({product.review_count})</span>
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-black text-gray-900 text-sm">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.compare_at_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(item)}
          disabled={!inStock || isAddingToCart}
          className="w-full flex items-center justify-center gap-1.5 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        >
          {isAddingToCart ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              Adding…
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              {inStock ? 'Add to Cart' : 'Unavailable'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecentlyViewedPage() {
  const { user } = useAuth();
  const addToCart = useCartStore((state) => state.addItem);

  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-item loading states
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [wishlistingId, setWishlistingId] = useState<string | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  // Clear all state
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const supabase = createClient();

  // ---- Fetch recently viewed ----
  const fetchRecentlyViewed = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('recently_viewed')
        .select(`
          id, viewed_at,
          product:products(
            id, title, price, compare_at_price, rating, review_count,
            images:product_images(url, is_primary),
            store:stores(name),
            inventory(quantity)
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const formatted: RecentlyViewedProduct[] = (data || [])
        .filter((row: any) => row.product)
        .map((row: any) => ({
          id: row.id,
          viewed_at: row.viewed_at,
          product: row.product,
        }));

      setItems(formatted);

      // Fetch wishlist state for these products
      if (formatted.length > 0) {
        const productIds = formatted.map((r) => r.product.id);
        const { data: wlData } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id)
          .in('product_id', productIds);

        if (wlData) {
          setWishlistedIds(new Set(wlData.map((w: any) => w.product_id)));
        }
      }
    } catch {
      setError('Failed to load your recently viewed products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  // ---- Remove single item ----
  const handleRemove = async (recordId: string) => {
    if (!user) return;
    try {
      setRemovingId(recordId);
      const { error: removeError } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (removeError) throw removeError;
      setItems((prev) => prev.filter((i) => i.id !== recordId));
    } catch {
      alert('Failed to remove item. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // ---- Add to cart (local + Supabase sync) ----
  const handleAddToCart = async (item: RecentlyViewedProduct) => {
    if (!user) return;
    try {
      setAddingToCartId(item.id);
      addToCart(item.product as any);
      await supabase.from('cart').upsert(
        {
          user_id: user.id,
          product_id: item.product.id,
          quantity: 1,
        },
        { onConflict: 'user_id,product_id,variant_id' }
      );
    } catch {
      // Zustand cart still updated; Supabase sync failure is non-critical
    } finally {
      setAddingToCartId(null);
    }
  };

  // ---- Toggle wishlist ----
  const handleToggleWishlist = async (productId: string) => {
    if (!user) return;
    try {
      setWishlistingId(productId);
      if (wishlistedIds.has(productId)) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await supabase.from('wishlist').upsert(
          { user_id: user.id, product_id: productId },
          { onConflict: 'user_id,product_id' }
        );
        setWishlistedIds((prev) => new Set(prev).add(productId));
      }
    } catch {
      // Silent fail
    } finally {
      setWishlistingId(null);
    }
  };

  // ---- Clear all history ----
  const handleClearAll = async () => {
    if (!user) return;
    try {
      setClearingAll(true);
      const { error: clearError } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id);

      if (clearError) throw clearError;
      setItems([]);
      setShowClearModal(false);
    } catch {
      alert('Failed to clear history. Please try again.');
    } finally {
      setClearingAll(false);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-44 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmClearModal
        isOpen={showClearModal}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
        loading={clearingAll}
      />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-[#FF6B00]" />
              Recently Viewed
              {items.length > 0 && (
                <span className="ml-1 bg-orange-100 text-[#FF6B00] text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {items.length === 0
                ? 'Products you visit will appear here'
                : `${items.length} product${items.length !== 1 ? 's' : ''} in your history`}
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All History
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState
              icon={History}
              title="No recently viewed products"
              description="Browse products and they will appear here so you can quickly find them again."
              actionLabel="Browse Products"
              actionHref="/"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isRemoving={removingId === item.id}
                isAddingToCart={addingToCartId === item.id}
                isWishlisting={wishlistingId === item.product.id}
                wishlistedIds={wishlistedIds}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
