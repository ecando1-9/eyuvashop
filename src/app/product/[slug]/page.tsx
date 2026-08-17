'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import { ProductCard } from '@/components/customer/ProductCard';
import { formatCurrency } from '@/lib/utils';
import { Star, Minus, Plus, ShoppingCart, Heart, Store, ShieldCheck, Truck, RotateCcw, MapPin, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { PriceHistoryModal } from '@/components/merchant/PriceHistoryModal';
import { History } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();
  
  const addItemToCart = useCartStore((state: any) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      // Fetch product
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select(`*, 
          images:product_images(*),
          store:stores(*),
          category:categories(id, name, slug),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('approval_status', 'approved')
        .single();

      if (prodErr || !prodData) {
        router.push('/products');
        return;
      }

      setProduct(prodData);
      
      const primaryImg = prodData.images?.find((img: any) => img.is_primary)?.url || prodData.images?.[0]?.url || '/placeholder.png';
      setMainImage(primaryImg);

      // Track recently viewed
      if (user) {
        await supabase.rpc('upsert_recently_viewed', { p_user_id: user.id, p_product_id: prodData.id });
      }

      // Fetch reviews
      const { data: revData } = await supabase
        .from('reviews')
        .select(`*, user:users(full_name, avatar_url)`)
        .eq('product_id', prodData.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (revData) setReviews(revData);

      // Fetch related
      if (prodData.category_id) {
        const { data: relData } = await supabase
          .from('products')
          .select(`id, title, slug, price, compare_at_price, rating, review_count, stock_quantity,
            images:product_images(url, is_primary),
            store:stores(name, slug)
          `)
          .eq('category_id', prodData.category_id)
          .eq('status', 'published')
          .neq('id', prodData.id)
          .limit(4);
          
        if (relData) setRelatedProducts(relData);
      }

      setLoading(false);
    };

    fetchProductDetails();
  }, [slug, supabase, user, router]);

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc' && quantity < product.stock_quantity) {
      setQuantity(q => q + 1);
    } else if (type === 'dec' && quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock_quantity === 0) return;
    addItemToCart({
      product_id: product.id,
      quantity,
      price: product.price,
      title: product.title,
      store_id: product.store_id
    });
    toast.success('Added to cart');
  };

  const handleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]"></div>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!product) return null;

  const isWishlisted = product ? isInWishlist(product.id) : false;
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 mb-16 md:mb-0">
        
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#FF6B00]">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-[#FF6B00]">{product.category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{product.title}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            
            {/* Left: Images */}
            <div className="md:w-1/2 p-6 md:border-r border-gray-100 flex flex-col">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4 border border-gray-100">
                {product.stock_quantity === 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    OUT OF STOCK
                  </div>
                )}
                {discountPercent > 0 && product.stock_quantity > 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-[#FF6B00] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {discountPercent}% OFF
                  </div>
                )}
                <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
              </div>
              
              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => (
                    <button
                      key={img.id}
                      onClick={() => setMainImage(img.url)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img.url ? 'border-[#FF6B00]' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0B1E3D] mb-1">{product.title}</h1>
              {product.title_te && (
                <h2 className="text-lg font-bold text-[#FF6B00] mb-3">{product.title_te}</h2>
              )}
              
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({product.review_count} reviews)</span>
                </div>
                {product.brand && (
                  <div className="text-sm text-gray-500 border-l pl-4">Brand: <span className="font-medium text-[#0B1E3D]">{product.brand}</span></div>
                )}
                <div className="text-sm text-gray-500 border-l pl-4">
                  Weight: <span className="font-bold text-gray-800">{product.parcel_weight_kg ? `${product.parcel_weight_kg} kg (Parcel)` : `${product.weight_kg || 0.5} kg`}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className="text-3xl font-bold text-[#0B1E3D]">{formatCurrency(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-gray-400 line-through mb-1">{formatCurrency(product.compare_at_price)}</span>
                )}
                <button
                  type="button"
                  onClick={() => setPriceHistoryOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B00] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-200 ml-auto"
                >
                  <History className="w-3.5 h-3.5" /> Price History
                </button>
              </div>

              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <div className="mb-6 inline-flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-sm font-medium">
                  Only {product.stock_quantity} left in stock - order soon!
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-4 mb-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700">Quantity</span>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleQuantityChange('dec')}
                      disabled={quantity <= 1 || product.stock_quantity === 0}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{product.stock_quantity === 0 ? 0 : quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange('inc')}
                      disabled={quantity >= product.stock_quantity || product.stock_quantity === 0}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#e56000] text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleWishlist}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center transition ${isWishlisted ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><ShieldCheck className="h-4 w-4" /></div>
                  1 Year Warranty
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-green-50 text-green-600 rounded-full"><RotateCcw className="h-4 w-4" /></div>
                  7 Days Return Policy
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><Truck className="h-4 w-4" /></div>
                  Fast Delivery
                </div>
              </div>

              {/* Store Brand & Trust Card */}
              {product.store && (
                <div className="mt-auto bg-gradient-to-br from-slate-50 to-orange-50/40 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <Link href={`/store/${product.store.slug}`} className="flex items-center gap-3.5 group">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-xs text-[#0B1E3D] overflow-hidden shrink-0 group-hover:border-[#FF6B00] transition-colors">
                      {product.store.logo_url ? (
                        <img src={product.store.logo_url} alt={product.store.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-6 w-6 text-[#FF6B00]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sold By</span>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-full">
                          <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified Seller
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 group-hover:text-[#FF6B00] transition-colors">{product.store.name}</div>
                      {(product.store.city || product.store.state) && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{[product.store.city, product.store.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {product.store.phone && (
                    <div className="text-right text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Seller Helpline</span>
                      <a href={`tel:${product.store.phone}`} className="font-mono font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {product.store.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="flex border-b overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-4 px-6 font-semibold whitespace-nowrap border-b-2 transition ${activeTab === 'description' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('specifications')}
              className={`flex-1 py-4 px-6 font-semibold whitespace-nowrap border-b-2 transition ${activeTab === 'specifications' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Specifications
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 px-6 font-semibold whitespace-nowrap border-b-2 transition ${activeTab === 'reviews' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
            )}

            {activeTab === 'specifications' && (
              <div className="max-w-2xl">
                <table className="w-full text-sm text-left text-gray-600">
                  <tbody>
                    <tr className="border-b"><th className="py-3 font-medium text-gray-900 w-1/3 bg-gray-50 px-4">Brand</th><td className="py-3 px-4">{product.brand || 'N/A'}</td></tr>
                    <tr className="border-b"><th className="py-3 font-medium text-gray-900 w-1/3 bg-gray-50 px-4">SKU</th><td className="py-3 px-4">{product.sku || 'N/A'}</td></tr>
                    <tr className="border-b"><th className="py-3 font-medium text-gray-900 w-1/3 bg-gray-50 px-4">Category</th><td className="py-3 px-4">{product.category?.name || 'N/A'}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                            {review.user?.avatar_url ? (
                              <img src={review.user.avatar_url} alt={review.user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                {review.user?.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0B1E3D]">{review.user?.full_name || 'Anonymous'}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {review.title && <h4 className="font-bold text-gray-900 mb-1">{review.title}</h4>}
                        <p className="text-gray-700 text-sm">{review.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0B1E3D] mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(rel => {
                const img = rel.images?.find((i: any) => i.is_primary)?.url || rel.images?.[0]?.url;
                return (
                  <ProductCard
                    key={rel.id}
                    product={{
                      ...rel,
                      images: rel.images || []
                    } as any}
                  />
                );
              })}
            </div>
          </div>
        )}
        <PriceHistoryModal
          productId={product.id}
          productTitle={product.title}
          isOpen={priceHistoryOpen}
          onClose={() => setPriceHistoryOpen(false)}
        />
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
