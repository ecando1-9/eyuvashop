'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingBag, Store, Settings, LogOut, Menu, X,
  Plus, ChevronRight, ShieldCheck, Clock, Home, Layers, Grid, AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SignOutModal } from '@/components/common/SignOutModal';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

interface MerchantLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function MerchantLayout({ children, title, subtitle, actions }: MerchantLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, loading: authLoading } = useAuth();

  // Stable supabase client reference — does not change between renders,
  // preventing it from being an unstable dependency in useEffect
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [merchantProfile, setMerchantProfile] = useState<any | null>(null);
  const [store, setStore] = useState<any | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  // Fetch merchant profile + store using selective column selects for performance
  const loadMerchantInfo = useCallback(async (userId: string) => {
    try {
      const { data: mProfile } = await supabase
        .from('merchant_profiles')
        .select('id, business_name, business_phone, business_address, verification_status, can_publish, rejection_reason')
        .eq('user_id', userId)
        .maybeSingle();

      if (mProfile) {
        setMerchantProfile(mProfile);
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, name, city, phone, email')
          .eq('merchant_id', mProfile.id)
          .maybeSingle();
        if (storeData) setStore(storeData);
      }
    } catch (err) {
      console.error("Error loading merchant layout profile:", err);
    } finally {
      setLoadingMerchant(false);
    }
  }, [supabase]);

  // Initial load — only fires when user.id changes (not on every render)
  useEffect(() => {
    if (!user?.id) {
      if (!authLoading) setLoadingMerchant(false);
      return;
    }
    setLoadingMerchant(true);
    loadMerchantInfo(user.id);
  }, [user?.id, authLoading, loadMerchantInfo]);

  // Approval status polling — re-fetch merchant profile every 30 seconds so admin
  // approval/rejection reflects on the merchant side without requiring a full page reload
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      supabase
        .from('merchant_profiles')
        .select('id, business_name, business_phone, business_address, verification_status, can_publish, rejection_reason')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMerchantProfile((prev: any) => {
              // Only trigger re-render if approval-relevant fields changed
              if (
                !prev ||
                prev.verification_status !== data.verification_status ||
                prev.can_publish !== data.can_publish ||
                prev.rejection_reason !== data.rejection_reason
              ) {
                return data;
              }
              return prev;
            });
          }
        });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, supabase]);

  const handleGlobalResubmit = async () => {
    if (!merchantProfile?.id) return;
    try {
      setResubmitting(true);
      const { error } = await supabase
        .from('merchant_profiles')
        .update({
          verification_status: 'pending',
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', merchantProfile.id);

      if (error) throw error;
      setMerchantProfile((prev: any) => ({ ...prev, verification_status: 'pending', rejection_reason: null }));
      setResubmitSuccess(true);
      setTimeout(() => setResubmitSuccess(false), 6000);
    } catch (err: any) {
      alert("Failed to submit approval request: " + err.message);
    } finally {
      setResubmitting(false);
    }
  };

  const businessName = merchantProfile?.business_name || store?.name || profile?.full_name || "Merchant Store";
  const verificationStatus = merchantProfile?.verification_status || 'pending';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const isRouteActive = (href: string) => {
    if (href === '/merchant') {
      return pathname === '/merchant';
    }
    if (href === '/merchant/products/new') {
      return pathname === '/merchant/products/new';
    }
    if (href === '/merchant/products') {
      return pathname === '/merchant/products' || (pathname.startsWith('/merchant/products/') && pathname !== '/merchant/products/new');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutDashboard },
    { label: 'Products', href: '/merchant/products', icon: Package },
    { label: 'Add Product', href: '/merchant/products/new', icon: Plus },
    { label: 'Categories', href: '/merchant/categories', icon: Grid },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Inventory', href: '/merchant/inventory', icon: Layers },
    { label: 'Store Profile', href: '/merchant/store', icon: Store },
    { label: 'Account Settings', href: '/account/settings', icon: Settings },
  ];


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Bar for Desktop & Mobile */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Stylized Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-gray-100 bg-white flex-shrink-0">
                <img src={LOGO_URL} alt="eYuvaShop" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-brand-logo italic font-bold text-2xl tracking-tight leading-none select-none flex items-baseline">
                  <span className="text-[#F57C00] not-italic font-bold">e</span>
                  <span className="text-[#0A234A] text-2xl leading-none">Y</span>
                  <span className="text-[#0A234A]">uva</span>
                  <span className="text-[#0A234A] text-2xl leading-none">S</span>
                  <span className="text-[#0A234A]">hop</span>
                </span>
                <span className="text-[10px] bg-orange-100 text-[#FF6B00] px-2 py-0.5 rounded-full uppercase font-black tracking-wider border border-orange-200">
                  Seller Hub
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {verificationStatus === 'approved' ? (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Merchant
              </span>
            ) : verificationStatus === 'rejected' ? (
              <button
                onClick={handleGlobalResubmit}
                disabled={resubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 transition-colors"
                title="Click to re-request admin approval"
              >
                <RefreshCw className={`w-3 h-3 ${resubmitting ? 'animate-spin' : ''}`} />
                <span>Re-request Approval</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Pending Approval
                </span>
                <button
                  onClick={handleGlobalResubmit}
                  disabled={resubmitting}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-[#FF6B00] underline"
                >
                  Re-submit Ping
                </button>
              </div>
            )}

            <Link
              href="/merchant/products/new"
              className="hidden sm:flex items-center gap-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>

            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              title="View Public Store"
            >
              <Home className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex-shrink-0">
                {userAvatar && !avatarError ? (
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600 bg-orange-100">
                    {businessName[0]?.toUpperCase() || 'M'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSignOutModal(true)}
                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Layout */}
      <div className="flex-1 flex w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Persistent Left Navigation Sidebar (Desktop/Tablet) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-6 sticky top-22">
            {/* Merchant Store Header Card */}
            <div className="p-3.5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/60">
              {loadingMerchant ? (
                <div className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-200"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-orange-200 rounded w-24"></div>
                    <div className="h-3 bg-orange-100 rounded w-16"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {store?.name?.[0] || businessName[0] || 'S'}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{businessName}</h3>
                    <p className="text-xs text-gray-500 capitalize">{store?.city || 'Merchant Partner'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Re-request Action in Sidebar if Rejected */}
            {verificationStatus === 'rejected' && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Action Needed</span>
                </div>
                <p className="text-[11px] text-red-700 leading-tight">
                  Update your store details and re-request admin approval.
                </p>
                <button
                  onClick={handleGlobalResubmit}
                  disabled={resubmitting}
                  className="w-full py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${resubmitting ? 'animate-spin' : ''}`} />
                  <span>{resubmitting ? 'Submitting...' : 'Re-request Approval'}</span>
                </button>
              </div>
            )}

            {/* Navigation Menu Links */}
            <nav className="space-y-1">
              <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Merchant Menu</p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/merchant/store"
                className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:text-[#FF6B00] transition-colors"
              >
                <span>Storefront Customization</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 bg-white p-5 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <img src={LOGO_URL} alt="" className="h-7 w-auto" />
                    <span className="font-extrabold text-lg">Merchant Portal</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                          isActive
                            ? 'bg-[#FF6B00] text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>


              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignOutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 p-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Resubmit Success Toast */}
          {resubmitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Approval request successfully submitted! Administrators have been notified to review your store.</span>
            </div>
          )}

          {(title || subtitle || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div>
                {title && <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal — redirects to /login after sign out */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          setShowSignOutModal(false);
          await signOut();
          router.push('/login');
        }}
      />
    </div>
  );
}
