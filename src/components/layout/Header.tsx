'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  Phone,
  Package,
} from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { createClient } from '@/lib/supabase/client';
import { debounce, formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import Image from 'next/image';

const categories = [
  { name: 'Nighties', slug: 'nighties' },
  { name: 'Langaalu', slug: 'langaalu' },
  { name: 'Tops', slug: 'tops' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  const cartItems = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.count());

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, price, compare_price, images')
          .ilike('title', `%${q}%`)
          .eq('is_active', true)
          .limit(6);
        setSearchResults((data || []) as Product[]);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      }
    }, 300),
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#1f2937] text-white text-center py-2.5 px-4 text-xs font-bold tracking-[0.1em] uppercase">
        Free shipping on orders above INR 499 | Use code{' '}
        <strong className="text-[#ff3e6c]">YUVA10</strong> for 10% off
      </div>

      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200/50 transition-all duration-300 ${isScrolled
            ? 'shadow-[0_10px_30px_rgba(0,0,0,0.05)] py-2'
            : 'py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6">

          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-slate-700" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-3 shrink-0"
              aria-label="eYuvaShop Home"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                <Image src="/eyuvashop.png" alt="eYuvaShop" width={36} height={36} className="object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                  eYuvaShop
                </span>
              </div>
            </Link>
          </div>

          {/* Middle: Search Box */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-2xl mx-auto relative group">
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center bg-slate-50 rounded-full border-2 border-transparent focus-within:border-[#ff3e6c]/30 focus-within:bg-white transition-all duration-300 group-hover:bg-slate-100 focus-within:shadow-sm">
                <Search size={18} className="absolute left-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for premium nighties, tops, brands..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    doSearch(e.target.value);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="w-full h-12 pl-12 pr-24 rounded-full text-sm font-medium focus:outline-none bg-transparent text-slate-900 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-9 px-5 bg-[#ff3e6c] hover:bg-[#e02a55] text-white text-xs font-bold tracking-wide rounded-full transition-all shadow-sm active:scale-[0.98]"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-16 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{product.title}</p>
                        <p className="text-sm text-[#ff3e6c] font-black mt-0.5">{formatCurrency(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => {
                    router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
                    setShowSearchDropdown(false);
                  }}
                  className="w-full text-center py-4 text-xs tracking-wider text-[#ff3e6c] font-bold hover:bg-[#ff3e6c]/5 border-t border-slate-100 transition-colors uppercase"
                >
                  View all results
                </button>
              </div>
            )}
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Nav Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-6 mr-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop?category=${cat.slug}`}
                  className="text-sm font-bold text-slate-600 hover:text-[#ff3e6c] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/shop" className="text-sm font-bold text-slate-900 hover:text-[#ff3e6c] transition-colors">
                Shop All
              </Link>
            </nav>

            {/* Profile Dropdown */}
            <div ref={userMenuRef} className="relative hidden sm:block">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Account"
              >
                <User size={22} className="text-slate-700" />
                <span className="text-sm font-bold text-slate-700">
                  {mounted && user ? 'Account' : 'Login'}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-fade-in py-2">
                  {mounted && user ? (
                    <>
                      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link href="/account" className="flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
                        <User size={18} className="text-slate-400" /> My Account
                      </Link>
                      <Link href="/account/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
                        <Package size={18} className="text-slate-400" /> My Orders
                      </Link>
                      <hr className="my-2 border-slate-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="p-5">
                      <p className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Welcome to eYuvaShop</p>
                      <Link
                        href="/login"
                        className="flex w-full items-center justify-center bg-[#ff3e6c] hover:bg-[#e02a55] text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors mb-3 shadow-[0_4px_10px_rgba(255,62,108,0.2)]"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="flex w-full items-center justify-center border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-sm font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={22} className="text-slate-700" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff3e6c] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] active:scale-[0.98]"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:block text-sm font-bold tracking-wide">Cart</span>
              {mounted && cartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#ff3e6c] text-white text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  {cartItems > 9 ? '9+' : cartItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile slide-in Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Image src="/eyuvashop.png" alt="eYuvaShop" width={28} height={28} className="object-cover" />
                </div>
                <span className="text-xl font-black text-slate-900">eYuvaShop</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-700" />
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                if (searchQuery.trim()) router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
              }}>
                <div className="relative flex items-center bg-white rounded-xl border border-slate-200 focus-within:border-[#ff3e6c]">
                  <Search size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <p className="px-5 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-5 py-4 text-base font-bold text-slate-700 hover:bg-[#ff3e6c]/5 hover:text-[#ff3e6c] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center px-5 py-4 text-base font-bold text-slate-700 hover:bg-[#ff3e6c]/5 hover:text-[#ff3e6c] transition-colors"
              >
                Shop All
              </Link>

              <div className="my-4 border-t border-slate-100" />

              <p className="px-5 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Account
              </p>
              {mounted && user ? (
                <>
                  <Link href="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-5 py-4 text-base font-bold text-slate-700 hover:bg-slate-50">
                    <User size={20} className="text-slate-400" /> Dashboard
                  </Link>
                  <Link href="/account/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-5 py-4 text-base font-bold text-slate-700 hover:bg-slate-50">
                    <Package size={20} className="text-slate-400" /> Orders
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-5 py-4 text-base font-bold text-red-500 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="px-5 py-4 flex gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center py-3 bg-[#ff3e6c] text-white text-sm font-bold rounded-xl"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center py-3 bg-slate-100 text-slate-900 text-sm font-bold rounded-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <a href="tel:18000000000" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
                <Phone size={16} className="text-[#ff3e6c]" /> Customer Support
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
