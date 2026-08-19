'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingBag, Heart, Bell, User, Store, Menu, X,
  Package, MapPin, Settings, LogOut, ChevronDown, ChevronRight, Shield, ShieldAlert, Grid,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { useAuth } from '@/hooks/useAuth';
import { SignOutModal } from '@/components/common/SignOutModal';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

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

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  
  const formatImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1]?.split('/')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  const userInitials = userDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

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

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, stores..."
            className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FF6B00] text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button Icon */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="md:hidden p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="w-5 h-5 text-gray-800" /> : <Search className="w-5 h-5" />}
          </button>
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
            <Link
              href="/login"
              className="p-2 text-gray-600 hover:text-[#FF6B00] rounded-full hover:bg-gray-50 transition-colors"
              aria-label="User Account"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : user ? (
            <>
              {/* Logged In — User Dropdown (PC & Tablet) */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-orange-50/50 border-2 border-[#FF6B00] rounded-full pl-1 pr-3 py-1 transition-all shadow-sm hover:shadow-orange-500/20 active:scale-95 group"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white shadow-xs bg-gray-100 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                    {userAvatar && !avatarError ? (
                      <img
                        src={formatImageUrl(userAvatar)}
                        alt={userDisplayName}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FF6B00] text-white flex items-center justify-center font-extrabold text-xs">
                        {userInitials}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-gray-800 hidden md:inline truncate max-w-[110px] group-hover:text-[#FF6B00]">
                    {userDisplayName.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#FF6B00]' : ''}`} />
                </button>

                {/* PC / Tablet Dropdown Menu Container (Full 4-Side Glowing Orange Border) */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border-2 border-[#FF6B00] overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200 shadow-orange-500/20">
                    {/* Header Glassmorphism Banner */}
                    <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white p-4 relative overflow-hidden border-b border-white/10">
                      {/* Ambient Orange Glow */}
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-[#FF6B00]/30 rounded-full blur-xl pointer-events-none" />

                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#FF6B00] shadow-md bg-gray-100 flex items-center justify-center font-black text-sm text-white shrink-0">
                          {userAvatar && !avatarError ? (
                            <img
                              src={formatImageUrl(userAvatar)}
                              alt={userDisplayName}
                              className="w-full h-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#FF6B00] text-white flex items-center justify-center font-black text-sm">
                              {userInitials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-extrabold text-white truncate">{userDisplayName}</p>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="p-2 space-y-1 text-xs font-bold text-gray-700">
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-[#FF6B00] transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-orange-100/70 text-[#FF6B00] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">My Account</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">My Orders</span>
                      </Link>

                      <Link
                        href="/account/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-pink-100/70 text-pink-600 flex items-center justify-center shrink-0">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="group-hover:translate-x-0.5 transition-transform">Wishlist</span>
                          {wishlistCount > 0 && (
                            <span className="bg-pink-100 text-pink-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-pink-200">
                              {wishlistCount}
                            </span>
                          )}
                        </div>
                      </Link>

                      <Link
                        href="/account/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Saved Addresses</span>
                      </Link>

                      <Link
                        href="/account/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Settings</span>
                      </Link>

                      <Link
                        href="/account/security"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Security</span>
                      </Link>

                      {/* Admin Control Panel Option */}
                      {(profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com' || user?.user_metadata?.role === 'admin') && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-950 via-slate-900 to-black text-white hover:opacity-95 transition-all shadow-md border border-red-500/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center font-extrabold text-[10px]">
                              🛡️
                            </div>
                            <span className="font-extrabold text-red-200">Admin Control</span>
                          </div>
                          <span className="text-[9px] font-black bg-red-600 px-2 py-0.5 rounded-full text-white shadow-xs">
                            Main Admin
                          </span>
                        </Link>
                      )}

                      {/* Seller Center Option */}
                      <Link
                        href="/merchant"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-gray-900 to-black text-white hover:opacity-95 transition-all shadow-xs border border-white/10"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-[#FF6B00] text-white flex items-center justify-center font-extrabold text-[10px]">
                            ⚡
                          </div>
                          <span>Sell on eYuvaShop</span>
                        </div>
                        <span className="text-[9px] font-black bg-[#FF6B00] px-2 py-0.5 rounded-full text-white">
                          Seller
                        </span>
                      </Link>
                    </div>

                    {/* Sign Out Button */}
                    <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowSignOutModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs transition-all active:scale-95"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out from Account
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <SignOutModal
                isOpen={showSignOutModal}
                onClose={() => setShowSignOutModal(false)}
                onConfirm={async () => {
                  setShowSignOutModal(false);
                  await signOut();
                }}
              />
            </>
          ) : (
            /* Not Logged In */
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-[#FF6B00] transition-colors shadow"
            >
              <User className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
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

      {/* Expandable Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <form onSubmit={handleSearchSubmit} className="md:hidden bg-gray-50 border-t border-b border-gray-200 px-4 py-3 animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, stores..."
              className="w-full pl-4 pr-11 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:border-[#FF6B00] shadow-sm"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FF6B00] text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow-xs"
              aria-label="Submit search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Premium Mobile Drawer with Full 4-Side Glowing Border */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-2 border-[#FF6B00] shadow-2xl animate-in slide-in-from-top-3 duration-200 overflow-hidden rounded-2xl mx-2 my-2 shadow-orange-500/10">
          {/* User Profile Banner (Dark Gradient Glassmorphism with Full 4-Side Glowing Orange Border) */}
          {mounted && user ? (
            <div className="mx-4 my-3 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white shadow-xl relative overflow-hidden border-2 border-[#FF6B00] shadow-orange-500/20">
              {/* Background ambient lighting */}
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#FF6B00]/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#FF6B00] shadow-md bg-gray-100 flex items-center justify-center font-black text-base text-white flex-shrink-0">
                  {userAvatar && !avatarError ? (
                    <img
                      src={formatImageUrl(userAvatar)}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FF6B00] text-white flex items-center justify-center font-black text-base">
                      {userInitials}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-white truncate">{userDisplayName}</p>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 truncate mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* Quick links strip inside profile card */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs font-semibold">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white backdrop-blur-xs active:scale-95"
                >
                  <User className="w-3.5 h-3.5 text-[#FF6B00]" /> My Account
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white backdrop-blur-xs active:scale-95"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" /> My Orders
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between m-4 rounded-2xl shadow-md border-2 border-orange-300">
              <div>
                <p className="font-extrabold text-sm">Welcome to eYuvaShop</p>
                <p className="text-xs text-orange-100">Sign in for exclusive deals</p>
              </div>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-white text-[#FF6B00] font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-orange-50 transition-all active:scale-95 border border-orange-200"
              >
                Login / Register
              </Link>
            </div>
          )}

          {/* Navigation Links with Full 4-Side Borders & Dotted Dividers */}
          <div className="px-4 pb-4 space-y-2.5">
            {/* Categories Card (Full 4-Side Orange Border) */}
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3.5 bg-gradient-to-r from-orange-50/80 via-orange-50/40 to-white hover:from-orange-100 hover:to-orange-50 border-2 border-[#FF6B00] rounded-xl flex items-center justify-between transition-all group shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 group-hover:text-[#FF6B00]">Categories</p>
                  <p className="text-[10px] text-gray-500">Explore products by category</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#FF6B00] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Dotted Divider before Wishlist */}
            <div className="border-t border-dashed border-gray-200 my-2" />

            {/* Wishlist Card (Full 4-Side Pink Border) */}
            <Link
              href="/account/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3.5 bg-gradient-to-r from-pink-50/80 via-pink-50/40 to-white hover:from-pink-100 hover:to-pink-50 border-2 border-pink-500 rounded-xl flex items-center justify-between transition-all group shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 group-hover:text-pink-600">Wishlist</p>
                  <p className="text-[10px] text-gray-500">View saved favorite items</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {wishlistCount > 0 && (
                  <span className="bg-pink-100 text-pink-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-pink-300">
                    {wishlistCount} items
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-pink-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Dotted Divider before Merchant */}
            <div className="border-t border-dashed border-gray-200 my-2" />

            {/* Become a Seller Badge Banner (Full 4-Side Glowing Orange Border) */}
            <Link
              href="/merchant"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-gray-900 to-black text-white shadow-lg border-2 border-[#FF6B00] shadow-orange-500/20 hover:opacity-95 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 font-black text-xs shadow-xs">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-extrabold">Sell on eYuvaShop</p>
                  <p className="text-[10px] text-gray-400">Grow your business online</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#FF6B00] px-2.5 py-1 rounded-full text-white shadow-xs border border-orange-400">
                Seller Center
              </span>
            </Link>

            {/* Admin Control Panel Banner (Only for Admins) */}
            {mounted && user && (profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com' || user?.user_metadata?.role === 'admin') && (
              <>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-black text-white shadow-lg border-2 border-red-500 shadow-red-500/20 hover:opacity-95 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-xs">
                      🛡️
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-red-200">Admin Control Panel</p>
                      <p className="text-[10px] text-red-300/80">Platform Governance Hub</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-red-600 px-2.5 py-1 rounded-full text-white shadow-xs border border-red-400">
                    Main Admin
                  </span>
                </Link>
              </>
            )}

            {/* Sign Out Button (Full 4-Side Red Border) */}
            {mounted && user && (
              <>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignOutModal(true);
                  }}
                  className="w-full p-3 bg-red-50 hover:bg-red-100 border-2 border-red-500 text-red-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  <LogOut className="w-4 h-4" /> Sign Out from Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
