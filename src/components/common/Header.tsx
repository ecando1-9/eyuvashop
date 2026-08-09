'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search, ShoppingBag, Heart, Bell, User, Store, Menu, X,
  Package, MapPin, Settings, LogOut, ChevronDown, Shield,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const cartCount = useCartStore((state) => state.getTotalCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { user, profile, loading, unreadNotifications, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'
      }`}
    >
      {/* Top Banner */}
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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity duration-200 hover:opacity-95">
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
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification Bell */}
          <Link
            href={user ? '/account/notifications' : '/login'}
            className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors hidden sm:block relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {mounted && user && unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Wishlist */}
          <Link
            href={user ? '/account/wishlist' : '/login'}
            className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {mounted && wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account — Auth Aware */}
          {!mounted || loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse hidden sm:block" />
          ) : user ? (
            /* Logged In — User Dropdown */
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full pl-1 pr-3 py-1 transition-colors group"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover w-8 h-8 flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {userInitials}
                  </div>
                )}
                <span className="text-xs font-semibold text-gray-700 max-w-[80px] truncate">
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <User className="w-4 h-4" /> My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <Heart className="w-4 h-4" /> Wishlist
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <MapPin className="w-4 h-4" /> Saved Addresses
                    </Link>
                    <Link
                      href="/account/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <Link
                      href="/account/security"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                    >
                      <Shield className="w-4 h-4" /> Security
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not Logged In */
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#FF6B00] transition-colors shadow"
            >
              <User className="w-4 h-4" /> Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
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

          {/* Mobile user info */}
          {mounted && user && (
            <div className="flex items-center gap-3 py-2 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 text-sm font-medium text-gray-700">
            {user ? (
              <>
                <Link href="/account" className="p-2 hover:bg-orange-50 hover:text-[#FF6B00] rounded-lg flex items-center gap-2"><User className="w-4 h-4" /> My Account</Link>
                <Link href="/account/orders" className="p-2 hover:bg-orange-50 hover:text-[#FF6B00] rounded-lg flex items-center gap-2"><Package className="w-4 h-4" /> Orders</Link>
                <Link href="/categories" className="p-2 hover:bg-gray-50 rounded-lg">Categories</Link>
                <Link href="/merchant" className="p-2 hover:bg-gray-50 rounded-lg">Sell on eYuvaShop</Link>
                <button
                  onClick={signOut}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/categories" className="p-2 hover:bg-gray-50 rounded-lg">Categories</Link>
                <Link href="/merchant" className="p-2 hover:bg-gray-50 rounded-lg">Become a Seller</Link>
                <Link href="/login" className="p-2 hover:bg-orange-50 text-[#FF6B00] rounded-lg font-bold col-span-2 text-center">Login / Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
