'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from '@/components/customer/ProductCard';



import { EmptyState } from '@/components/ui/EmptyState';
import { Filter, Search, X, SlidersHorizontal, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Supabase types for this page
type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_trending: boolean;
  created_at: string;
  stock_quantity: number;
  images: { url: string; is_primary: boolean; display_order: number }[];
  store: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
};

const ITEMS_PER_PAGE = 10;

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter state
  const searchQuery = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const page = parseInt(searchParams.get('page') || '1');
  const inStock = searchParams.get('in_stock') === 'true';

  // Local filter state for inputs before applying
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('approval_status', 'approved');
      if (data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select(
        `id, title, title_te, slug, price, compare_at_price, rating, review_count, is_featured, is_new_arrival, is_best_seller, is_trending, search_priority, created_at, stock_quantity,
        images:product_images(url, is_primary, display_order),
        store:stores(name, slug, priority),
        category:categories!inner(name, slug)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .eq('approval_status', 'approved')
      .is('deleted_at', null);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,title_te.ilike.%${searchQuery}%`);
    }

    if (categorySlug) {
      query = query.eq('categories.slug', categorySlug);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (inStock) {
      query = query.gt('stock_quantity', 0);
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        // Relevance: Prioritized by admin search_priority first, then featured, then newest
        query = query
          .order('search_priority', { ascending: false, nullsFirst: false })
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (data) {
      setProducts(data as any[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [supabase, searchQuery, categorySlug, minPrice, maxPrice, inStock, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = (newFilters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset to page 1 on filter change if page is not explicitly being updated
    if (!newFilters.page) {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: localSearch || null });
  };

  const applyPriceFilter = () => {
    updateFilters({ min_price: localMinPrice || null, max_price: localMaxPrice || null });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-[#0B1E3D] mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              className="text-[#FF6B00] focus:ring-[#FF6B00]"
              checked={categorySlug === ''}
              onChange={() => updateFilters({ category: null })}
            />
            <span className="text-gray-700 text-sm">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                className="text-[#FF6B00] focus:ring-[#FF6B00]"
                checked={categorySlug === cat.slug}
                onChange={() => updateFilters({ category: cat.slug })}
              />
              <span className="text-gray-700 text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold text-[#0B1E3D] mb-3">Price Range</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full px-2 py-1 border rounded text-sm focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full px-2 py-1 border rounded text-sm focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
          />
        </div>
        <button
          onClick={applyPriceFilter}
          className="mt-2 w-full bg-[#FF6B00] text-white text-sm py-1.5 rounded hover:bg-[#e56000] transition"
        >
          Apply Price
        </button>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-lg font-semibold text-[#0B1E3D] mb-3">Availability</h3>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="text-[#FF6B00] focus:ring-[#FF6B00] rounded"
            checked={inStock}
            onChange={(e) => updateFilters({ in_stock: e.target.checked ? 'true' : null })}
          />
          <span className="text-gray-700 text-sm">In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 mb-16 md:mb-0">
        
        {/* Top Bar: Search & Mobile Filter Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full sm:w-auto flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <button type="submit" className="hidden"></button>
            </form>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <button
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
              <select
                className="border-gray-300 rounded-lg text-sm focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <SlidersHorizontal className="h-5 w-5 text-[#FF6B00]" />
                <h2 className="text-xl font-bold text-[#0B1E3D]">Filters</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Mobile Filter Drawer */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
              <div className="relative w-4/5 max-w-xs bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-left">
                <div className="p-4 flex items-center justify-between border-b">
                  <h2 className="text-xl font-bold text-[#0B1E3D]">Filters</h2>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow">
                  <FilterContent />
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-[#FF6B00] text-white py-2 rounded-lg font-medium"
                  >
                    View Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-500">
              Showing {totalCount > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} products
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-72 animate-pulse p-4 flex flex-col gap-3">
                    <div className="bg-gray-200 h-40 rounded-lg w-full"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product as any}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center items-center gap-2">
                    <button
                      onClick={() => updateFilters({ page: String(page - 1) })}
                      disabled={page === 1}
                      className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => updateFilters({ page: String(page + 1) })}
                      disabled={page === totalPages}
                      className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="product"
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                actionLabel="Clear All Filters"
                actionHref="/products"
              />
            )}
          </div>
        </div>
      </main>

      
      
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
