'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Grid3X3, List, Search } from 'lucide-react';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

interface ShopLayoutProps {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Popularity', value: 'popular' },
];

const normalizeValue = (value?: string) =>
  (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const isClothingCategory = (category: Category) => {
  const slug = normalizeValue(category.slug);
  const name = normalizeValue(category.name);
  return ['fashion', 'clothing', 'clothes', 'cloths', 'apparel'].some(
    (key) => slug.includes(key) || name.includes(key)
  );
};

export default function ShopLayout({
  products,
  categories,
  total,
  page,
  totalPages,
  searchParams,
}: ShopLayoutProps) {
  const router = useRouter();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const clothingCategories = categories.filter(isClothingCategory);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    Object.entries({ ...searchParams, ...updates }).forEach(([key, value]) => {
      if (value && value !== 'undefined') current.set(key, value);
    });
    current.delete('page');
    router.push(`/shop?${current.toString()}`);
  };

  const clearFilters = () => router.push('/shop');

  const hasActiveFilters = !!(searchParams.category || searchParams.minPrice || searchParams.maxPrice || searchParams.search);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Categories</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateParams({ category: undefined })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !searchParams.category ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Clothing
            </button>
          </li>
          {clothingCategories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => updateParams({ category: cat.slug })}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  searchParams.category === cat.slug
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Price Range</h3>
        <div className="space-y-2">
          {[
            { label: 'Under ₹500', min: '0', max: '500' },
            { label: '₹500 – ₹1,000', min: '500', max: '1000' },
            { label: '₹1,000 – ₹5,000', min: '1000', max: '5000' },
            { label: '₹5,000 – ₹10,000', min: '5000', max: '10000' },
            { label: 'Above ₹10,000', min: '10000', max: undefined },
          ].map((range) => (
            <button
              key={range.label}
              onClick={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                searchParams.minPrice === range.min && searchParams.maxPrice === range.max
                  ? 'bg-orange-50 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        {/* Custom range */}
        <div className="flex items-center gap-2 mt-3">
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams.minPrice}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:border-orange-400 focus:outline-none"
            onBlur={(e) => e.target.value && updateParams({ minPrice: e.target.value })}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={searchParams.maxPrice}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:border-orange-400 focus:outline-none"
            onBlur={(e) => e.target.value && updateParams({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm font-semibold text-red-500 hover:text-red-600 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-orange-500">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Shop</span>
            {searchParams.category && (
              <>
                <span>/</span>
                <span className="text-gray-800 font-medium capitalize">{searchParams.category.replace('-', ' ')}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Header */}
        {searchParams.search && (
          <div className="mb-6 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <p className="text-sm text-gray-600">
              Results for <strong>&quot;{searchParams.search}&quot;</strong> — {total} products found
            </p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-5">Filters</h2>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-orange-500"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">!</span>
                  )}
                </button>

                <span className="text-sm text-gray-500 hidden sm:block">
                  Showing <strong>{products.length}</strong> of <strong>{total}</strong> products
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={searchParams.sort || 'newest'}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-400 bg-white w-auto"
                  style={{ width: 'auto' }}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Grid/List toggle (desktop) */}
                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Grid3X3 size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">Active:</span>
                {searchParams.category && (
                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                    {searchParams.category}
                    <button onClick={() => updateParams({ category: undefined })}><X size={10} /></button>
                  </span>
                )}
                {searchParams.minPrice && (
                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                    Min ₹{searchParams.minPrice}
                    <button onClick={() => updateParams({ minPrice: undefined })}><X size={10} /></button>
                  </span>
                )}
                {searchParams.maxPrice && (
                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                    Max ₹{searchParams.maxPrice}
                    <button onClick={() => updateParams({ maxPrice: undefined })}><X size={10} /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Clear all
                </button>
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6">Try changing your filters or search query</p>
                <button
                  onClick={clearFilters}
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-4'
              }>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <button
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    ← Prev
                  </button>
                )}
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateParams({ page: String(pageNum) })}
                      className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-orange-500 text-white'
                          : 'border border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {page < totalPages && (
                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Filters</h2>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterSidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
