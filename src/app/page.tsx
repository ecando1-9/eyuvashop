'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import { HeroCarousel } from '@/components/customer/HeroCarousel';
import { ProductCard } from '@/components/customer/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_BANNERS, MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_STORES } from '@/lib/constants/mockData';
import { Product } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ArrowRight, Sparkles, TrendingUp, Award, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6 space-y-12">
        {/* Hero Carousel */}
        {MOCK_BANNERS.length > 0 ? (
          <HeroCarousel banners={MOCK_BANNERS} />
        ) : (
          <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white min-h-[280px] md:min-h-[340px] flex items-center justify-center p-8 shadow-xl text-center border border-gray-800">
            <div className="max-w-xl space-y-3">
              <span className="bg-[#FF6B00] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                eYuvashop Marketplace
              </span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                Welcome to eYuvashop Platform
              </h1>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Connect your Supabase database or register as a merchant to publish live banners, products, and categories.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/merchant"
                  className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md"
                >
                  Become a Seller
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all border border-gray-700"
                >
                  Customer Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Shop by Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Shop by Category</h2>
              <p className="text-xs text-gray-500">Explore curated collections across top departments</p>
            </div>
            {MOCK_CATEGORIES.length > 0 && (
              <Link href="/categories" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {MOCK_CATEGORIES.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {MOCK_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:border-[#FF6B00]/30 transition-all duration-300"
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 bg-gray-100 group-hover:scale-110 transition-transform">
                    {cat.image_url && <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />}
                  </div>
                  <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#FF6B00] transition-colors">{cat.name}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Categories Available"
              description="Categories will appear here once added by merchants or approved by platform admin."
              icon="sparkles"
              actionLabel="Add Category in Merchant Hub"
              actionHref="/merchant"
            />
          )}
        </section>

        {/* Featured Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6B00]" />
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Featured Products</h2>
            </div>
          </div>

          {MOCK_PRODUCTS.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Featured Products Available"
              description="Your product catalog is empty. Merchants can list products directly from the Merchant Portal."
              icon="product"
              actionLabel="Create Product in Seller Hub"
              actionHref="/merchant"
            />
          )}
        </section>

        {/* Featured Stores */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Featured Merchant Stores</h2>
              <p className="text-xs text-gray-500">Buy directly from verified brand flagships</p>
            </div>
          </div>

          {MOCK_STORES.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_STORES.map((store) => (
                <div key={store.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-32 w-full bg-gray-200">
                    {store.banner_url && <Image src={store.banner_url} alt={store.name} fill className="object-cover" />}
                  </div>
                  <div className="p-6 relative pt-0 flex flex-col justify-between">
                    <div className="flex items-end justify-between -mt-10 mb-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-white">
                        {store.logo_url && <Image src={store.logo_url} alt={store.name} fill className="object-cover" />}
                      </div>
                      <Link
                        href={`/store/${store.slug}`}
                        className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#FF6B00] transition-colors"
                      >
                        Visit Store
                      </Link>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-gray-900">{store.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{store.description}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs font-medium text-gray-600">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" /> <span className="font-bold">{store.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{store.followers_count.toLocaleString()} Followers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Merchant Stores Registered"
              description="Approved merchant storefronts will be highlighted here once verified by platform admins."
              icon="store"
              actionLabel="Register New Merchant Store"
              actionHref="/login?redirect=/merchant&tab=merchant&mode=register"
            />
          )}
        </section>

        {/* Promotional Banner */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FF6B00] to-orange-600 p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="bg-white/20 text-white text-xs font-black uppercase px-3 py-1 rounded-full">Multi-Vendor Enterprise Engine</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">Scale Your Online Store with eYuvashop</h2>
            <p className="text-xs md:text-sm text-orange-100">Directly sync your Supabase PostgreSQL database to manage inventory, sales analytics, and global customer orders.</p>
          </div>
          <Link href="/merchant" className="bg-white text-gray-900 font-extrabold text-sm px-6 py-3.5 rounded-full hover:bg-gray-100 transition-all shadow-lg whitespace-nowrap">
            Open Seller Account
          </Link>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
