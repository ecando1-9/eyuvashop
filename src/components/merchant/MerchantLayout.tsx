'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, Package, Grid, Store, Settings, 
  LogOut, Plus, ShieldCheck, Clock, Menu, X, CreditCard, ChevronRight, Home, Users, Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SignOutModal } from '@/components/common/SignOutModal';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

interface MerchantLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MerchantLayout({ children, title, subtitle }: MerchantLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const supabase = createClient();

  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    async function loadMerchantInfo() {
      if (!user) return;
      try {
        const { data: mProfile } = await supabase
          .from('merchant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (mProfile) {
          setMerchantProfile(mProfile);
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', mProfile.id)
            .single();
          if (storeData) setStore(storeData);
        }
      } catch (err) {
        console.error("Error loading merchant layout profile:", err);
      }
    }
    loadMerchantInfo();
  }, [user, supabase]);

  const businessName = merchantProfile?.business_name || store?.name || profile?.full_name || user?.email?.split('@')[0] || "Merchant Store";
  const verificationStatus = merchantProfile?.verification_status || 'pending';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const navItems = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutDashboard },
    { label: 'Products', href: '/merchant/products', icon: Package },
    { label: 'Add Product', href: '/merchant/products/new', icon: Plus },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Categories', href: '/categories', icon: Grid },
    { label: 'Inventory', href: '/merchant/inventory', icon: Layers },
    { label: 'Store Profile', href: '/merchant/store', icon: Store },
    { label: 'Account Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Bar for Desktop & Mobile */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="eYuvaShop" className="h-8 w-auto object-contain" />
              <span className="font-extrabold text-xl tracking-tight text-gray-900 hidden sm:inline">
                eYuva<span className="text-[#FF6B00]">Shop</span>
                <span className="ml-2 text-xs bg-orange-100 text-[#FF6B00] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                  Merchant
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {verificationStatus === 'approved' ? (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Merchant
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Pending Verification
              </span>
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

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left Side Navigation Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-6 sticky top-22">
            {/* Merchant Store Header Card */}
            <div className="p-3.5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {store?.name?.[0] || businessName[0] || 'S'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{businessName}</h3>
                  <p className="text-xs text-gray-500 capitalize">{store?.city || 'Merchant Partner'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1">
              <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Merchant Menu</p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/merchant' && pathname.startsWith(item.href));
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

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-[#FF6B00] text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignOutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 min-w-0">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          setShowSignOutModal(false);
          await signOut();
        }}
      />
    </div>
  );
}
