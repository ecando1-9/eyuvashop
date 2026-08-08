'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingBag, Eye, Store } from 'lucide-react';
import { Product } from '@/types/database';
import { formatCurrency, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent = calculateDiscount(product.price, product.compare_at_price);
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between hover:shadow-xl hover:border-gray-200 transition-all duration-300 relative">
      {/* Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3">
        <Image
          src={primaryImage}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF6B00] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(product)}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-colors shadow-sm ${
            isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-[#FF6B00] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Store Name */}
          {product.store && (
            <Link
              href={`/store/${product.store.slug}`}
              className="text-[11px] font-medium text-gray-400 hover:text-[#FF6B00] flex items-center gap-1 mb-1 truncate"
            >
              <Store className="w-3 h-3" /> {product.store.name}
            </Link>
          )}

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="font-semibold text-sm text-gray-900 hover:text-[#FF6B00] line-clamp-2 transition-colors">
            {product.title}
          </Link>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1 text-xs">
          <div className="flex items-center gap-0.5 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{product.rating}</span>
          </div>
          <span className="text-gray-400">({product.review_count})</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div>
            <div className="text-base font-extrabold text-gray-900">
              {formatCurrency(product.price)}
            </div>
            {product.compare_at_price && (
              <div className="text-xs text-gray-400 line-through">
                {formatCurrency(product.compare_at_price)}
              </div>
            )}
          </div>

          <button
            onClick={() => addItem(product)}
            className="bg-gray-900 hover:bg-[#FF6B00] text-white p-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center active:scale-95"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
