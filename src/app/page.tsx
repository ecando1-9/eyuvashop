'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollableRow } from '@/components/ui/ScrollableRow';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { HeroCarousel } from '@/components/customer/HeroCarousel';
import { ProductCard } from '@/components/customer/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product, Banner, Category, Store, HomeSection } from '@/types/database';
import { ChevronRight, Store as StoreIcon, TrendingUp, Sparkles, Star, ShieldCheck, Truck, Heart, Quote , Clock} from 'lucide-react';
import { getDefaultCategoryImage } from '@/lib/utils';

interface HomePageData {
  recently_viewed?: any[];
  for_you?: any[];
  banners: Banner[];
  categories: Category[];
  products?: any[];
  trending_products?: any[];
  featured_products?: any[];
  stores: Store[];
  home_sections: HomeSection[];
  home_sections_error?: any;
  home_sections_raw?: any;
  label_sections?: { label: any, products: any[] }[];
}

export default function HomePage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const [bannersRes, categoriesRes, productsRes, storesRes, homeSectionsRes] = await Promise.all([
          supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true }),
          supabase.from('categories').select('*').eq('approval_status', 'approved').order('display_order', { ascending: true }),
          supabase.from('products').select(`
            id, title, title_te, slug, price, compare_at_price, rating, review_count, status, approval_status, is_featured, is_trending, is_best_seller, is_new_arrival, created_at, store_id, category_id, description, sku, stock_quantity, low_stock_threshold,
            images:product_images(url, is_primary),
            store:stores(name, slug, priority_level),
            label_assignments:product_label_assignments(label:product_labels(*))
          `).eq('status', 'published').eq('approval_status', 'approved').is('deleted_at', null).limit(100),
          supabase.from('stores').select('*').eq('is_active', true).limit(8),
          supabase.from('home_sections').select('*, products:home_section_products(product:products(*, images:product_images(*), store:stores(name, slug, priority_level)))').eq('is_active', true).order('display_order', { ascending: true })
        ]);

        let directProducts = (productsRes.data || []).map((p: any) => ({
          ...p,
          primary_image: p.images?.find((img: any) => img.is_primary)?.url || p.images?.[0]?.url,
          store_name: p.store?.name,
          store_slug: p.store?.slug,
          store_priority: p.store?.priority_level || 0
        }));
        
        directProducts.sort((a, b) => {
          if (b.store_priority !== a.store_priority) return b.store_priority - a.store_priority;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        directProducts = directProducts.slice(0, 24);

        // Build Label-based sections dynamically from the fetched products
          const { data: labelsData } = await supabase.from('product_labels').select('*');
          let labelSections: any[] = [];
          if (labelsData && labelsData.length > 0) {
            labelsData.forEach(label => {
              const taggedProducts = directProducts.filter((p: any) => p.label_assignments?.some((la: any) => la.label?.id === label.id));
              if (taggedProducts.length > 0) {
                // sort by priority inside the tag
                taggedProducts.sort((a: any, b: any) => ((Array.isArray(b.store) ? b.store[0]?.priority_level : b.store?.priority_level) || 0) - ((Array.isArray(a.store) ? a.store[0]?.priority_level : a.store?.priority_level) || 0));
                labelSections.push({ label, products: taggedProducts });
              }
            });
          }

          // Fetch Personalization Data
        let recentlyViewedProducts: any[] = [];
        let forYouProducts: any[] = [];
        try {
          const sessionId = localStorage.getItem('eyuva_session_id');
          if (user?.id || sessionId) {
            // Get last 15 product views
            const { data: views } = await supabase.from('user_events')
              .select('target_id')
              .eq('event_type', 'view_product')
              .or(`user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'},session_id.eq.${sessionId || 'none'}`)
              .order('created_at', { ascending: false })
              .limit(15);
              
            if (views && views.length > 0) {
              const productIds = Array.from(new Set(views.map(v => v.target_id).filter(Boolean)));
              if (productIds.length > 0) {
                const { data: rpData } = await supabase.from('products').select(`
                  id, title, title_te, slug, price, compare_at_price, rating, review_count, status, approval_status, is_featured, is_trending, is_best_seller, is_new_arrival, created_at, store_id, category_id, description, sku, stock_quantity, low_stock_threshold,
                  images:product_images(url, is_primary),
                  store:stores(name, slug, priority_level),
                  label_assignments:product_label_assignments(label:product_labels(*))
                `).in('id', productIds.slice(0, 8));
                
                if (rpData) {
                  recentlyViewedProducts = productIds.map(id => rpData.find(p => p.id === id)).filter(Boolean);
                }
                
                // For You: fetch products from same categories as viewed
                const viewedCategories = Array.from(new Set(recentlyViewedProducts.map((p: any) => p.category_id)));
                if (viewedCategories.length > 0) {
                  const { data: fyData } = await supabase.from('products').select(`
                    id, title, title_te, slug, price, compare_at_price, rating, review_count, status, approval_status, is_featured, is_trending, is_best_seller, is_new_arrival, created_at, store_id, category_id, description, sku, stock_quantity, low_stock_threshold,
                    images:product_images(url, is_primary),
                    store:stores(name, slug, priority_level),
                    label_assignments:product_label_assignments(label:product_labels(*))
                  `).in('category_id', viewedCategories).eq('status', 'published').not('id', 'in', `(${productIds.join(',')})`).limit(12);
                  
                  if (fyData) {
                    forYouProducts = fyData.sort((a: any, b: any) => ((Array.isArray(b.store) ? b.store[0]?.priority_level : b.store?.priority_level) || 0) - ((Array.isArray(a.store) ? a.store[0]?.priority_level : a.store?.priority_level) || 0));
                  }
                }
              }
            }
          }
        } catch (e) { console.warn("Personalization skip:", e); }

        setData({
          recently_viewed: recentlyViewedProducts,
          for_you: forYouProducts,
          label_sections: labelSections,
          banners: bannersRes.data || [],
          categories: categoriesRes.data || [],
          trending_products: directProducts.filter((p: any) => p.is_trending).length > 0 
            ? directProducts.filter((p: any) => p.is_trending) 
            : directProducts,
          featured_products: directProducts.filter((p: any) => p.is_featured),
          products: directProducts,
          stores: storesRes.data || [],
          home_sections: homeSectionsRes.data || [],
          home_sections_error: homeSectionsRes.error,
          home_sections_raw: homeSectionsRes
        });
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
      title_te: rawProduct.title_te,
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
      labels: rawProduct.label_assignments || [],
      images: rawProduct.primary_image || rawProduct.images?.[0]?.url ? [{ id: '1', product_id: rawProduct.id, url: rawProduct.primary_image || rawProduct.images?.[0]?.url, is_primary: true, alt_text: rawProduct.title, display_order: 1, created_at: '' }] : [],
      store: {
        id: rawProduct.store_id || '',
        name: rawProduct.store_name || 'Store',
        slug: rawProduct.store_slug || 'store',
        merchant_id: '',
        description: null,
        logo_url: null,
        banner_url: null,
        phone: null,
        email: null,
        city: null,
        state: null,
        pin_code: null,
        status: 'draft',
        is_active: true,
        is_featured: false,
        rating: 0,
        followers_count: 0,
        created_at: '',
        updated_at: ''
      }
    };
  };

  const banners = data?.banners || [];
  const categories = data?.categories || [];
  const products = (data?.trending_products || data?.products || []).map(transformProduct);
  const stores = data?.stores || [];
  const homeSections = data?.home_sections || [];
  const recentlyViewed = (data?.recently_viewed || []).map(transformProduct);
  const forYou = (data?.for_you || []).map(transformProduct);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <main className="w-full mx-auto pb-12">
        {isLoading ? (
          <div className="w-full space-y-8 animate-pulse">
            <div className="w-full h-[200px] md:h-[400px] bg-gray-200"></div>
            
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
            
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
            <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
                <Link href="/categories" className="text-sm font-bold text-[#FF6B00] flex items-center hover:underline">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              {categories.length > 0 ? (
                <ScrollableRow className="gap-4 md:gap-6 pb-4 pt-2">
                    {categories.map((category) => (
                    <Link key={category.id} href={`/categories/${category.slug}`} className="flex flex-col items-center group flex-shrink-0 snap-start w-20 md:w-24">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden mb-2 group-hover:border-[#FF6B00] group-hover:shadow-md transition-all">
                        <div className="relative w-full h-full">
                            <Image src={category.image_url || getDefaultCategoryImage(category.name)} alt={category.name} fill className="object-cover" sizes="(max-width: 768px) 64px, 80px" />
                          </div>
                        </div>
                      <span className="text-xs md:text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-[#FF6B00] transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </ScrollableRow>
              ) : (
                <EmptyState icon="sparkles" title="No Categories Available" description="Categories will appear here once added by admin." />
              )}
            </section>

            
            {/* For You Section */}
            {forYou.length > 0 && (
              <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#FF6B00]" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recommended For You</h2>
                  </div>
                </div>
                <ScrollableRow className="gap-4 pb-6 pt-2">
                  {forYou.map((product) => (
                    <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </ScrollableRow>
              </section>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-[#FF6B00]" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recently Viewed</h2>
                  </div>
                </div>
                <ScrollableRow className="gap-4 pb-6 pt-2">
                  {recentlyViewed.map((product) => (
                    <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </ScrollableRow>
              </section>
            )}

            {/* Trending Products */}
            <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#FF6B00]" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Trending Products</h2>
                </div>
              </div>
              
              {products.length > 0 ? (
                <ScrollableRow className="gap-4 pb-6 pt-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">
                        <ProductCard product={product} />
                      </div>
                    ))}
                </ScrollableRow>
              ) : (
                <EmptyState icon="product" title="No Products Yet" description="Merchants can list products from the Seller Hub." actionLabel="Become a Seller" actionHref="/merchant" />
              )}
            </section>
            
            
            
            
            
{/* Custom Home Sections */}

            {homeSections.map((section: any) => {
              let secProducts = [];
              if (section.linked_category_id) {
                // Auto-populated from the general products list (which is already prioritized)
                secProducts = products.filter(p => p.category_id === section.linked_category_id).slice(0, 10);
              } else {
                // Manual assignment via home_section_products
                secProducts = (section.products || [])
                  .map((sp: any) => transformProduct(sp.product))
                  .filter(Boolean)
                  .sort((a: any, b: any) => {
                    const pA = a.store?.priority_level || 0;
                    const pB = b.store?.priority_level || 0;
                    if (pB !== pA) return pB - pA;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  });
              }
                
              if (secProducts.length === 0) return null;
              
              return (
                <section key={section.id} className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{section.title}</h2>
                    {section.description && <p className="text-sm text-gray-500 ml-4 hidden md:block flex-1">{section.description}</p>}
                  </div>
                  
                  <ScrollableRow className="gap-4 pb-6 pt-2">
                      {secProducts.map((product: any) => (
                        <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">
                          <ProductCard product={product} />
                        </div>
                      ))}
                  </ScrollableRow>
                </section>
              );
            })}

            {/* Featured Stores */}
            <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-6 h-6 text-[#FF6B00]" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Stores</h2>
                </div>
              </div>
              
              {stores.length > 0 ? (
                <ScrollableRow className="gap-6 pb-6 pt-2">
                    {stores.map((store) => (
                    <Link key={store.id} href={`/store/${store.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group block flex-shrink-0 snap-start w-[280px] md:w-[320px]">
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
                </ScrollableRow>
              ) : (
                <EmptyState icon="store" title="No Merchant Stores" description="Approved merchant storefronts will appear here." actionLabel="Register as Merchant" actionHref="/merchant" />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
