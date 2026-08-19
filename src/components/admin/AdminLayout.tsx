'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, LayoutDashboard, Store, Package, ShoppingBag, Grid, 
  Users, FileText, DollarSign, LogOut, Menu, X, ChevronRight, Home, 
  ExternalLink, Bell, Search, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SignOutModal } from '@/components/common/SignOutModal';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [stats, setStats] = useState({
    pendingMerchants: 0,
    pendingProducts: 0
  });

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
      } else if (profile && !isAdmin) {
        router.push('/');
      }
    }
  }, [user, profile, authLoading, isAdmin, router, pathname]);

  useEffect(() => {
    async function loadPendingCounts() {
      if (!user || !isAdmin) return;
      try {
        const { count: mCount } = await supabase
          .from('merchant_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');

        const { count: pCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending');

        setStats({
          pendingMerchants: mCount || 0,
          pendingProducts: pCount || 0
        });
      } catch (err) {
        console.error("Error loading pending counts:", err);
      }
    }
    loadPendingCounts();
  }, [user, isAdmin, supabase]);

  const navItems = [
    { label: 'System Overview', href: '/admin', icon: LayoutDashboard },
    { 
      label: 'Merchant Approvals', 
      href: '/admin/merchants', 
      icon: Store, 
      badge: stats.pendingMerchants > 0 ? `${stats.pendingMerchants}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { 
      label: 'Product Approvals', 
      href: '/admin/products', 
      icon: Package, 
      badge: stats.pendingProducts > 0 ? `${stats.pendingProducts}` : undefined,
      badgeColor: 'bg-orange-100 text-[#FF6B00]'
    },
    { label: 'Orders & Shipments', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Categories & Tax', href: '/admin/categories', icon: Grid },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Audit Trail & DB Logs', href: '/admin/audit-log', icon: FileText },
  ];

  const [avatarError, setAvatarError] = useState(false);
  const adminName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'System Administrator';
  const adminEmail = user?.email || 'admin@eyuvashop.com';
  const adminAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatarUrl || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Enterprise Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <img src={LOGO_URL} alt="eYuvaShop Logo" className="h-8 w-auto object-contain" />
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden sm:inline">
                  eYuva<span className="text-[#FF6B00]">Shop</span>
                </span>
                <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Admin Control
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#FF6B00] bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Marketplace
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            {/* Admin Profile Info */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white border border-slate-200 overflow-hidden flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                {adminAvatar && !avatarError ? (
                  <img 
                    src={adminAvatar} 
                    alt={adminName} 
                    className="w-full h-full object-cover" 
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>{adminName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">{adminName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{adminEmail}</p>
              </div>
            </div>

            <button
              onClick={() => setShowSignOutModal(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Container with Sidebar + Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Persistent Left Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sticky top-20 space-y-6">
            <div className="px-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Administration Hub
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#FF6B00] text-white shadow-sm shadow-orange-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#FF6B00]' : (item.badgeColor || 'bg-slate-100 text-slate-700')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Security Mode</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Protected with Supabase RLS & Audit Logs.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <img src={LOGO_URL} alt="Logo" className="h-7 w-auto" />
                    <span className="font-extrabold text-base text-slate-900">Admin Control</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                          isActive
                            ? 'bg-[#FF6B00] text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignOutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {(title || subtitle || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                {title && <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          await signOut();
          router.push('/login');
        }}
      />
    </div>
  );
}
