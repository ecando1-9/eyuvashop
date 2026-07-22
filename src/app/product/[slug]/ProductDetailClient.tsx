'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Share2,
  Star,
  Truck,
  Shield,
  RefreshCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { Product, Review } from '@/types';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore, useRecentlyViewedStore } from '@/lib/wishlist-store';
import { calculateDiscount, formatCurrency, getDeliveryDate } from '@/lib/utils';
import ProductCard from '@/components/ui/ProductCard';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  related: Product[];
  reviews: Review[];
}

export default function ProductDetailClient({ product, related, reviews }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { toggleItem, hasItem } = useWishlistStore();
  const { addProduct } = useRecentlyViewedStore();

  const isWishlisted = hasItem(product.id);
  const discount = calculateDiscount(product.price, product.compare_price);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    addProduct(product);
  }, [product.id]);

  const handleAddToCart = async () => {
    if ((product.sizes?.length || 0) > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setIsAdding(true);
    await new Promise((r) => setTimeout(r, 400));
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success(`Added ${quantity} item(s) to cart!`, { icon: '🛒' });
    setIsAdding(false);
  };

  const handleBuyNow = () => {
    if ((product.sizes?.length || 0) > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    window.location.href = '/cart';
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/600'];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-orange-500">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-orange-500">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-orange-500">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-800 font-medium line-clamp-1">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT: Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
              <Image
                src={images[selectedImage]}
                alt={product.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Nav Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-700" />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-orange-500 shadow-md'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`View ${i + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col gap-5">
            {/* Category */}
            {product.category && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-xs font-bold text-orange-500 uppercase tracking-wider hover:text-orange-600"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating Summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-black text-gray-900">{formatCurrency(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-2.5 py-1 rounded-lg">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
            {product.compare_price && product.compare_price > product.price && (
              <p className="text-sm text-green-600 font-medium -mt-3">
                You save {formatCurrency(product.compare_price - product.price)} 🎉
              </p>
            )}

            {/* Stock Indicator */}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <span className="flex items-center gap-1.5 text-sm text-red-600 font-semibold">
                  <AlertTriangle size={14} /> Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold">
                  <AlertTriangle size={14} /> Only {product.stock} left — Hurry!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
                  <Check size={14} /> In Stock
                </span>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-700">Select Size</p>
                  <button className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                        selectedSize === size
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">
                  Color: <span className="font-normal text-gray-500">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                        selectedColor === color
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-gray-200 rounded-l-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 h-10 border-t border-b border-gray-200 flex items-center justify-center text-sm font-bold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 border border-gray-200 rounded-r-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  product.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-2 border-orange-300'
                }`}
              >
                <ShoppingCart size={18} />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  product.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
                }`}
              >
                ⚡ Buy Now
              </button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { toggleItem(product.id); toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); }}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Share2 size={15} /> Share
              </button>
            </div>

            {/* Delivery & Guarantees */}
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
              <div className="flex items-start gap-3">
                <Truck size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Free Delivery</p>
                  <p className="text-xs text-gray-500">
                    Est. delivery by <strong>{getDeliveryDate(5)}</strong> · Free on orders above ₹499
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCcw size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">30-Day Returns</p>
                  <p className="text-xs text-gray-500">Hassle-free returns and refunds</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">100% Authentic</p>
                  <p className="text-xs text-gray-500">Genuine product guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12 border border-gray-100 rounded-3xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100">
            {(['description', 'specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p>No description available for this product.</p>
                )}
                {product.youtube_url && (
                  <div className="mt-6">
                    <h4 className="text-base font-bold text-gray-800 mb-3">Product Video</h4>
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <iframe
                        src={product.youtube_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        title="Product Video"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value], i) => (
                        <tr key={key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2.5 px-4 font-semibold text-gray-700 w-1/3">{key}</td>
                          <td className="py-2.5 px-4 text-gray-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                              {review.profile?.first_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {review.profile?.first_name} {review.profile?.last_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>}
                        {review.body && <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(review.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          <span className="ml-2 text-green-500 font-semibold">✓ Verified Purchase</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
