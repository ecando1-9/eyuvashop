'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Grid, Search, ChevronRight, Sparkles } from 'lucide-react';
import { getDefaultCategoryImage } from '@/lib/utils';



import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_name?: string;
  parent_id?: string | null;
  is_featured: boolean;
  display_order: number;
  product_count?: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('approval_status', 'approved')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching categories:', error);
          setCategories([]);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        console.error('Exception:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const filtered = categories.filter(
    (cat) =>
      !cat.parent_id &&
      (search === '' || cat.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              All Categories
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {categories.length} categories available
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition-all"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Categories Found"
            description={
              search
                ? `No categories match "${search}". Try a different search.`
                : 'Categories will appear here once added by the admin.'
            }
            icon="sparkles"
            actionLabel={search ? 'Clear Search' : undefined}
            actionHref={search ? '/categories' : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filtered.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-lg hover:border-[#FF6B00]/30 transition-all duration-300 active:scale-95"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden mb-3 bg-orange-50 group-hover:scale-110 transition-transform duration-300 shadow-sm flex items-center justify-center">
                  <Image src={category.image_url || getDefaultCategoryImage(category.name)} alt={category.name} fill className="object-cover" sizes="80px" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#FF6B00] transition-colors leading-tight line-clamp-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{category.description}</p>
                )}
                <div className="mt-3 flex items-center gap-1 text-[#FF6B00] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Browse</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Subcategory sections for featured categories */}
        {!loading && !search && filtered.length > 0 && (
          <section className="space-y-8 pt-4">
            {filtered.filter((c) => c.is_featured).slice(0, 3).map((cat) => {
              const subs = categories.filter((c) => c.parent_id === cat.id);
              if (subs.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Grid className="w-4 h-4 text-[#FF6B00]" />
                      {cat.name}
                    </h2>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-xs text-[#FF6B00] font-bold flex items-center gap-1 hover:underline"
                    >
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/products?category=${sub.slug}`}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      
      
    </div>
  );
}
