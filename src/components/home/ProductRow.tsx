import Link from 'next/link';
import type { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ArrowUpRight } from 'lucide-react';

interface ProductRowProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  badge?: string;
}

export default function ProductRow({
  title,
  subtitle,
  products,
  viewAllHref = '/shop',
  badge,
}: ProductRowProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-5">
            {badge && (
              <span className="inline-flex text-[10px] font-bold bg-[#0F172A] text-white px-3 py-1 rounded-full tracking-[0.3em] shadow-sm">
                {badge}
              </span>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 font-display">{title}</h2>
              {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
            </div>
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#FF6A00] hover:text-[#E85F00]"
            >
              View all <ArrowUpRight size={14} />
            </Link>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <p className="text-xs text-slate-500">Editorial Picks</p>
              <p className="text-sm font-semibold text-slate-900 mt-2">
                Discover best sellers and fresh arrivals updated every week.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Avg Delivery', value: '2-5 Days' },
                  { label: 'Verified Stores', value: 'Top Brands' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className="text-xs font-semibold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
