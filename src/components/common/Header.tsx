'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, Heart, Bell, User, Store, Menu, X } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartCount = useCartStore((state) => state.getTotalCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'
      }`}
    >
      {/* Top Banner Bar */}
      <div className="bg-gray-900 text-white text-xs py-1.5 px-4 text-center flex justify-between items-center w-full">
        <span className="hidden sm:inline">🚀 Express Shipping on Orders Above ₹999 | 100% Guaranteed Authentic</span>
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <Link href="/merchant" className="hover:text-[#FF6B00] transition-colors flex items-center gap-1 font-medium">
            <Store className="w-3.5 h-3.5" /> Become a Seller
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/admin" className="hover:text-[#FF6B00] transition-colors font-medium">
            Admin Portal
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4">
        {/* Premium Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-opacity duration-200 hover:opacity-95"
        >
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white group-hover:scale-105 transition-transform flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png"
              alt="eYuvaShop Logo"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <span className="font-brand-logo italic font-bold text-3xl md:text-4xl tracking-[-0.03em] leading-none select-none flex items-baseline">
            <span className="text-[#F57C00] not-italic font-bold">e</span>
            <span className="text-[#0A234A] text-4xl md:text-5xl leading-none">Y</span>
            <span className="text-[#0A234A]">uva</span>
            <span className="text-[#0A234A] text-4xl md:text-5xl leading-none">S</span>
            <span className="text-[#0A234A]">hop</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="text"
            placeholder="Search products, brands, stores..."
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all shadow-inner"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FF6B00] text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/account/notifications" className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors hidden sm:block relative">
            <Bell className="w-5 h-5" />
          </Link>

          <Link href="/account/wishlist" className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors relative">
            <Heart className="w-5 h-5" />
            {mounted && wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link href="/cart" className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <Link href="/auth/login" className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#FF6B00] transition-colors shadow">
            <User className="w-4 h-4" /> Account
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search eYuvashop..."
              className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-sm"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm font-medium text-gray-700">
            <Link href="/categories" className="p-2 hover:bg-gray-50 rounded-md">Categories</Link>
            <Link href="/merchant" className="p-2 hover:bg-gray-50 rounded-md">Seller Dashboard</Link>
            <Link href="/auth/login" className="p-2 hover:bg-gray-50 rounded-md">Login / Register</Link>
            <Link href="/admin" className="p-2 hover:bg-gray-50 rounded-md">Admin Portal</Link>
          </div>
        </div>
      )}
    </header>
  );
}
