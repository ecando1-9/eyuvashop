'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import { HeroCarousel } from '@/components/customer/HeroCarousel';
import { ProductCard } from '@/components/customer/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product, Banner, Category, Store } from '@/types/database';
import { ChevronRight, Store as StoreIcon, TrendingUp, Sparkles, Star } from 'lucide-react';

interface HomePageData {
  banners: Banner[];
  categories: Category[];
  products: any[];
  stores: Store[];
}

export default function HomePage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: rpcData, error } = await supabase.rpc('get_homepage_data');
        if (error) {
          console.error('Error fetching homepage data:', error);
        } else if (rpcData) {
          setData(rpcData as any);
        }
      } catch (err) {
        console.error('Exception fetching homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Transform products from RPC to match ProductCard expected structure
  const transformProduct = (rawProduct: any): Product => {
    return {
      id: rawProduct.id,
      title: rawProduct.title,
      slug: rawProduct.slug,
      price: rawProduct.price,
      compare_at_price: rawProduct.compare_at_price,
      rating: rawProduct.rating || 0,
      review_count: rawProduct.review_count || 0,
      status: rawProduct.status,
      approval_status: rawProduct.approval_status,
      is_featured: rawProduct.is_featured,
      is_trending: rawProduct.is_trending,
      is_best_seller: rawProduct.is_best_seller,
      is_new_arrival: rawProduct.is_new_arrival,
      created_at: rawProduct.created_at,
      store_id: rawProduct.store_id,
      category_id: rawProduct.category_id,
      brand: rawProduct.brand,
      description: rawProduct.description,
      sku: rawProduct.sku,
      stock_quantity: rawProduct.stock_quantity || 0,
      low_stock_threshold: rawProduct.low_stock_threshold || 5,
      rejection_reason: null,
      submitted_at: null,
      updated_at: rawProduct.updated_at,
      deleted_at: null,
      images: rawProduct.primary_image ? [{ id: '1', product_id: rawProduct.id, url: rawProduct.primary_image, is_primary: true, alt_text: rawProduct.title, display_order: 1, created_at: '' }] : [],
      store: {
        name: rawProduct.store_name,
        slug: rawProduct.store_slug
      }
    };
  };

  const banners = data?.banners || [];
  const categories = data?.categories || [];
  const products = (data?.products || []).map(transformProduct);
  const stores = data?.stores || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />
      
      <main className="w-full mx-auto pb-12">
        {isLoading ? (
          <div className="w-full space-y-8 animate-pulse">
            <div className="w-full h-[200px] md:h-[400px] bg-gray-200"></div>
            
            <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="h-8 bg-gray-200 w-48 mb-6 rounded"></div>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-gray-200 w-48 rounded"></div>
                <div className="h-6 bg-gray-200 w-24 rounded"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="w-full mb-8">
              {banners.length > 0 ? (
                <HeroCarousel banners={banners} />
              ) : (
                <div className="w-full h-[200px] md:h-[400px] bg-[#0B1E3D] flex items-center justify-center text-white p-4 text-center">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to eYuvashop</h1>
                    <p className="text-lg md:text-xl text-gray-300">Your trusted multi-vendor marketplace</p>
                  </div>
                </div>
              )}
            </div>

            {/* Categories Section */}
            <section className="max-w-7xl mx-auto px-4 mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
                <Link href="/categories" className="text-sm font-medium text-[#FF6B00] flex items-center hover:underline">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              {categories.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 md:gap-6">
                  {categories.slice(0, 8).map((category) => (
                    <Link key={category.id} href={`/categories/${category.slug}`} className="flex flex-col items-center group">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden mb-2 group-hover:border-[#FF6B00] group-hover:shadow-md transition-all">
                        {category.image_url ? (
                          <div className="relative w-full h-full">
                            <Image src={category.image_url} alt={category.name} fill className="object-cover" sizes="(max-width: 768px) 64px, 80px" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-[#FF6B00] transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon="sparkles" title="No Categories Available" description="Categories will appear here once added by admin." />
              )}
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#FF6B00]" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Trending Products</h2>
                </div>
              </div>
              
              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <EmptyState icon="product" title="No Products Yet" description="Merchants can list products from the Seller Hub." actionLabel="Become a Seller" actionHref="/merchant" />
              )}
            </section>

            {/* Featured Stores */}
            <section className="max-w-7xl mx-auto px-4 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-6 h-6 text-[#FF6B00]" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Stores</h2>
                </div>
              </div>
              
              {stores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {stores.map((store) => (
                    <Link key={store.id} href={`/store/${store.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group block">
                      <div className="h-32 bg-gray-100 relative">
                        {store.banner_url ? (
                          <Image src={store.banner_url} alt={store.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#0B1E3D]/10"></div>
                        )}
                        <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
                          {store.logo_url ? (
                            <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#0B1E3D] flex items-center justify-center text-white font-bold text-lg">
                              {store.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-8 pb-4 px-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#FF6B00] transition-colors">{store.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{store.city}{store.state ? `, ${store.state}` : ''}</p>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{store.rating ? Number(store.rating).toFixed(1) : 'New'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon="store" title="No Merchant Stores" description="Approved merchant storefronts will appear here." actionLabel="Register as Merchant" actionHref="/merchant" />
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
