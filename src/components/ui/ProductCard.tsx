'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { calculateDiscount, formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

export default function ProductCard({ product, showBadge = true }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { toggleItem, hasItem } = useWishlistStore();

  const isWishlisted = hasItem(product.id);
  const discount = calculateDiscount(product.price, product.compare_price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.title.slice(0, 30)}... added to cart.`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
    toast.success(isWishlisted ? 'Removed from wishlist.' : 'Added to wishlist.');
  };

  const mainImage = imgError
    ? 'https://via.placeholder.com/400x400?text=No+Image'
    : product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image';
  const hoverImage = product.images?.[1] || mainImage;
  const rating = product.avg_rating ?? 0;
  const ratingCount = product.review_count ?? 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div
        className="bg-white rounded-[28px] border border-slate-200/80 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_55px_rgba(15,23,42,0.18)] hover:-translate-y-1 transition-all duration-300 relative ring-1 ring-slate-900/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <Image
            src={isHovered && hoverImage !== mainImage ? hoverImage : mainImage}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {showBadge && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount > 0 && (
                <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/70 shadow-sm">
                  -{discount}%
                </span>
              )}
              {product.is_new && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              {product.is_bestseller && (
                <span className="bg-[#FF6A00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap size={9} />BEST
                </span>
              )}
              {product.stock === 0 && (
                <span className="bg-slate-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SOLD OUT
                </span>
              )}
            </div>
          )}

          <div
            className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-all duration-200 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
          >
            <button
              onClick={handleWishlistToggle}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
              aria-label="Add to wishlist"
            >
              <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <Link
              href={`/product/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] text-gray-600 transition-colors"
              aria-label="Quick view"
            >
              <Eye size={14} />
            </Link>
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-white/90 backdrop-blur-sm text-[#FF6A00] text-[10px] font-semibold px-2 py-1 rounded-full text-center">
                Only {product.stock} left
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {product.category && (
            <p className="text-[10px] font-semibold text-[#FF6A00] uppercase tracking-[0.2em] mb-2">
              {product.category.name}
            </p>
          )}

          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-[#FF6A00] transition-colors">
            {product.title}
          </h3>

          {ratingCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star size={12} fill="currentColor" />
                <span className="text-slate-700 font-semibold">{rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-400">({ratingCount})</span>
            </div>
          )}

          <div className="flex items-baseline gap-1.5 mb-3 flex-wrap">
            <span className="text-base font-bold text-slate-900">
              {formatCurrency(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(product.compare_price)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                isHovered
                  ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A00]/20'
                  : 'bg-[#0F172A] text-white hover:bg-[#FF6A00]'
              }`}
            >
              <ShoppingCart size={12} />
              Add to Cart
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
