'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingBag, Eye, Store } from 'lucide-react';
import { Product } from '@/types/database';
import { formatCurrency, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartQuantity = useCartStore((state) =>
    state.items.find((item) => item.product.id === product.id)?.quantity || 0
  );
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent = calculateDiscount(product.price, product.compare_at_price ?? undefined);
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
  const stockQuantity = typeof product.stock_quantity === 'number' ? product.stock_quantity : undefined;
  const remainingStock = stockQuantity === undefined ? undefined : Math.max(stockQuantity - cartQuantity, 0);
  const isOutOfStock = stockQuantity !== undefined && stockQuantity <= 0;
  const isCartAtStockLimit = remainingStock !== undefined && remainingStock <= 0;
  const disableAddToCart = isOutOfStock || isCartAtStockLimit;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between hover:shadow-xl hover:border-gray-200 transition-all duration-300 relative">
      {/* Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF6B00] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-md transition-colors shadow-sm ${
            isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
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

          {/* Product Title (English & Telugu) */}
          <Link href={`/product/${product.slug}`} className="font-semibold text-sm text-gray-900 hover:text-[#FF6B00] line-clamp-1 transition-colors block">
            {product.title}
          </Link>
          {product.title_te && (
            <span className="text-xs font-bold text-[#FF6B00] line-clamp-1 block -mt-0.5">
              {product.title_te}
            </span>
          )}
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
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const result = await addItem(product);

              if (result.success) {
                toast.success('Added to cart');
              } else {
                toast.error(result.message || 'Out of stock');
              }
            }}
            disabled={disableAddToCart}
            className="bg-gray-900 hover:bg-[#FF6B00] text-white p-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:active:scale-100"
            title={disableAddToCart ? 'Out of stock' : 'Add to Cart'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {remainingStock !== undefined && (
          <div className={`text-[11px] font-semibold ${remainingStock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
            {remainingStock > 0 ? `${remainingStock} available` : 'Out of stock'}
          </div>
        )}
      </div>
    </div>
  );
}
