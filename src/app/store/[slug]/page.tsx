'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from '@/components/customer/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';



import type { Product } from '@/types/database';

interface Storefront {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  rating?: number | null;
  city?: string | null;
  phone?: string | null;
  state?: string | null;
}

export default function StorePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const [store, setStore] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*, merchant:merchant_profiles(business_name, business_email)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();


      if (storeError || !storeData) {
        setStore(null);
        setIsLoading(false);
        return;
      }

      setStore(storeData as Storefront);

      // Fetch store products
      const { data: productsData } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('store_id', storeData.id)
        .eq('status', 'published')
        .eq('approval_status', 'approved');

      setProducts((productsData || []) as Product[]);
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, supabase]);

  useEffect(() => {
    if (!slug) return;
    fetchStoreData();
  }, [fetchStoreData, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        
        <main className="flex-grow animate-pulse">
          <div className="h-64 bg-gray-200 w-full"></div>
          <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6 relative -top-12">
              <div className="w-32 h-32 bg-gray-300 rounded-lg shadow-md border-4 border-white"></div>
              <div className="pt-14 space-y-3 flex-1">
                <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
                <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-72 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
        
        
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        
        <main className="flex-grow w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <EmptyState
            icon="store"
            title="Store Not Found"
            description="The store you're looking for doesn't exist or is currently inactive."
            actionLabel="Go Back Home"
            actionHref="/"
          />
        </main>
        
        
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-20 md:pb-0">
      

      {/* Store Banner */}
      <main className="flex-grow pb-12">
        <div className="w-full h-48 md:h-72 bg-gradient-to-r from-[#0B1E3D] to-blue-900 relative">
          {store.banner_url && (
            <Image 
              src={store.banner_url} 
              alt={store.name} 
              fill 
              className="object-cover opacity-80"
            />
          )}
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Store Info Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative -top-16 mb-[-2rem]">
            <div className="flex flex-col md:flex-row gap-6 md:items-end">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 border-4 border-white relative -mt-16 md:-mt-20 z-10">
                {store.logo_url ? (
                  <Image src={store.logo_url} alt={store.name} fill className="object-contain" />
                ) : (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center text-[#FF6B00] font-bold text-3xl">
                    {store.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{store.name}</h1>
                    {store.phone && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600 bg-gray-100/50 w-fit px-3 py-1 rounded-full border border-gray-200">
                        <svg className="w-4 h-4 text-[#FF6B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {store.phone}
                      </div>
                    )}
                {store.description && (
                  <p className="text-gray-600 mt-2 text-sm md:text-base max-w-2xl">{store.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-gray-900">{store.rating || 'New'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{products.length} Products</span>
                  </div>
                  {(store.city || store.state) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{[store.city, store.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:ml-auto">
                <button className="w-full md:w-auto bg-[#FF6B00] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#e66000] transition-colors">
                  Follow Store
                </button>
              </div>
            </div>
          </div>

          {/* Store Products */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0B1E3D]">All Products</h2>
            </div>
            
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500">This store has not added any products.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      
      
    </div>
  );
}
