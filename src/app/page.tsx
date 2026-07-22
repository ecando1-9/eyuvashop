import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import HeroBanner from '@/components/home/HeroBanner';
import CategoriesSection from '@/components/home/CategoriesSection';
import ProductRow from '@/components/home/ProductRow';
import type { Banner, Category, Product } from '@/types';
import { ShieldCheck, Truck, RefreshCcw, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: 'eYuvaShop - Shop Smart, Live Better',
  description: "India's premium online shopping destination. Discover fashion, electronics, beauty, and more.",
};

async function getHomeData() {
  try {
    const supabase = await createClient();

    const [bannersResult, categoriesResult, productsResult] = await Promise.all([
      supabase.from('banners').select('*').eq('is_active', true).order('position').limit(5),
      supabase.from('categories').select('*').order('position').limit(8),
      supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('is_active', true)
        .limit(50),
    ]);

    return {
      banners: (bannersResult.data || []) as Banner[],
      categories: (categoriesResult.data || []) as Category[],
      products: (productsResult.data || []) as Product[],
    };
  } catch {
    return { banners: [], categories: [], products: [] };
  }
}

export default async function HomePage() {
  const { banners, categories, products } = await getHomeData();

  const trending = products.filter((p) => p.is_featured);
  const bestSellers = products.filter((p) => p.is_bestseller);
  const newArrivals = products.filter((p) => p.is_new);

  const benefits = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Pan-India in 2-5 days' },
    { icon: ShieldCheck, title: 'Secure Payments', desc: 'Trusted checkout options' },
    { icon: RefreshCcw, title: 'Easy Returns', desc: '30-day return policy' },
    { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
  ];

  return (
    <div>
      <HeroBanner />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 mb-4 bg-[#ff3e6c]/10 text-[#ff3e6c] text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display mb-4">
              Premium Shopping Experience
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              We deliver authentic products with transparent pricing, fast shipping, and reliable support.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group p-8 rounded-[2rem] bg-slate-50 hover:bg-white border border-slate-100 hover:border-[#ff3e6c]/20 hover:shadow-[0_20px_40px_rgba(255,62,108,0.08)] transition-all duration-500 text-center flex flex-col items-center hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-[#ff3e6c] text-[#ff3e6c] group-hover:text-white shadow-sm flex items-center justify-center transition-colors duration-500 mb-6">
                  <benefit.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-500">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CategoriesSection />

      <div className="bg-white">
        <ProductRow
          title="Trending Now"
          subtitle="Hottest picks from our catalog"
          products={trending.length > 0 ? trending : products.slice(0, 10)}
          viewAllHref="/shop?sort=popular"
          badge="TRENDING"
        />
      </div>

      <div className="bg-[#F8FAFC]">
        <ProductRow
          title="Best Sellers"
          subtitle="Our most loved products"
          products={bestSellers.length > 0 ? bestSellers : products.slice(10, 20)}
          viewAllHref="/shop?sort=popular"
          badge="POPULAR"
        />
      </div>

      <div className="bg-white">
        <ProductRow
          title="New Arrivals"
          subtitle="Fresh products just added"
          products={newArrivals.length > 0 ? newArrivals : products.slice(20, 30)}
          viewAllHref="/shop?sort=newest"
          badge="NEW"
        />
      </div>
    </div>
  );
}
