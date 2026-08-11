'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingBag, Package, Grid, Layers, Users, Star, TrendingUp, DollarSign, Tag, Store, Settings, LogOut, Bell, Plus, Search, Clock, AlertTriangle, ShieldCheck, Lock, Menu, X, Inbox } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SignOutModal } from '@/components/common/SignOutModal';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

export default function MerchantDashboard() {
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    today_revenue: 0,
    pending_orders: 0,
    monthly_revenue: 0,
    total_products: 0,
    published_products: 0,
    pending_products: 0,
    rejected_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0
  });
  
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadMerchantData() {
      if (!user) return;
      try {
        const { data: mProfile } = await supabase
          .from('merchant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (mProfile) {
          setMerchantProfile(mProfile);
          if (mProfile.business_name) setBusinessName(mProfile.business_name);
          if (mProfile.verification_status) setVerificationStatus(mProfile.verification_status as any);
          
          // Load Stats via RPC
          const { data: statsData } = await supabase.rpc('get_merchant_dashboard_stats', { p_merchant_id: mProfile.id });
          if (statsData) {
            setStats(statsData);
          }
          
          // Load Recent Orders
          const { data: stores } = await supabase.from('stores').select('id').eq('merchant_id', mProfile.id).single();
          if (stores) {
            const { data: recentOrders } = await supabase.from('order_items')
              .select('id, quantity, total_price, merchant_status, created_at, product:products(title), order:orders(order_number)')
              .eq('store_id', stores.id)
              .order('created_at', { ascending: false })
              .limit(5);
              
            if (recentOrders) {
              setOrders(recentOrders);
            }
          }
        }
      } catch (err) {
        console.error("Error loading merchant data:", err);
      }
    }
    loadMerchantData();
  }, [user, supabase]);

  const merchantName = businessName || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Merchant Store";
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const [avatarError, setAvatarError] = useState(false);

  const formatImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1]?.split('/')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Coming soon!');
  };

  const sidebarNav = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true, href: '/merchant' },
    { label: 'Orders', icon: ShoppingBag, badge: stats.pending_orders > 0 ? `${stats.pending_orders} New` : undefined, href: '/merchant/orders' },
    { label: 'Products', icon: Package, href: '/merchant/products' },
    { label: 'Categories', icon: Grid, href: '/merchant' },
    { label: 'Inventory', icon: Layers, href: '/merchant/inventory' },
    { label: 'Customers', icon: Users, href: '/merchant', onClick: handleComingSoon },
    { label: 'Reviews', icon: Star, href: '/merchant' },
    { label: 'Analytics', icon: TrendingUp, href: '/merchant', onClick: handleComingSoon },
    { label: 'Revenue', icon: DollarSign, href: '/merchant', onClick: handleComingSoon },
    { label: 'Coupons', icon: Tag, href: '/merchant' },
    { label: 'Store Settings', icon: Store, href: '/merchant/store' },
    { label: 'Settings', icon: Settings, href: '/merchant' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans">
      {/* Sidebar - Clean Light Theme like Shopify / Amazon Seller */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden lg:flex shadow-sm">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <span className="font-extrabold text-lg tracking-tight italic">
              <span className="text-[#FF6B00] not-italic">e</span>
              <span className="text-[#1E293B]">YuvaShop</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-[#FF6B00] text-white shadow-md'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6B00]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" /> {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <button onClick={() => setShowSignOutModal(true)} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors w-full text-left">
          <LogOut className="w-4 h-4" /> Exit Seller Hub
        </button>

        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={async () => {
            setShowSignOutModal(false);
            await signOut();
          }}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#FF6B00] bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 lg:hidden transition-all active:scale-95 shadow-xs"
              aria-label="Toggle mobile seller menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="relative w-7 h-7 rounded-lg overflow-hidden lg:hidden border border-gray-100 shrink-0">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <h1 className="font-black text-base sm:text-lg text-[#0B1E3D] truncate">Seller Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-[#FF6B00] bg-gray-100 rounded-xl relative">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {userAvatar && !avatarError ? (
                  <img
                    src={formatImageUrl(userAvatar)}
                    alt={merchantName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#FF6B00] text-white flex items-center justify-center font-black text-xs">
                    {merchantName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-gray-800 block truncate max-w-[140px]">{merchantName}</span>
                <span className="text-[10px] text-gray-400 font-medium block">Seller Account</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Verification Status Banner */}
          {verificationStatus === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 font-bold">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-amber-900 text-sm">Awaiting Account Verification</h3>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pending Admin Approval
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your merchant store application has been submitted and is currently being reviewed by an Administrator. 
                  All seller features (adding products, inventory management, receiving orders) will be automatically unlocked once your store verification is approved.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 flex-shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-red-900 text-sm">Store Application Rejected</h3>
                  <span className="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  Your store application was not approved by the Administrator. Please contact platform support or update your business documentation to re-apply.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-800 font-bold">
                Store Verified & Active — All Seller Features Unlocked
              </p>
            </div>
          )}

          {/* Top Metrics Row - Bright cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Today's Sales</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{formatCurrency(stats.today_revenue || 0)}</h3>
              <p className="text-[11px] text-emerald-600 mt-2 font-semibold">Real-time sync active</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Pending Orders</p>
              <h3 className="text-2xl font-black text-[#FF6B00] mt-1">{stats.pending_orders || 0}</h3>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">Requires fulfillment</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Monthly Revenue</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{formatCurrency(stats.monthly_revenue || 0)}</h3>
              <p className="text-[11px] text-emerald-600 mt-2 font-semibold">Current month</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Total Products</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{stats.total_products || 0}</h3>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">Live in store catalog</p>
            </div>
          </div>
          
          {/* Secondary Metrics Row - Products Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Catalog Health</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm divide-x divide-gray-200">
              <div className="pr-4">
                <span className="text-gray-500 mr-2">Published:</span>
                <span className="font-bold text-emerald-600">{stats.published_products || 0}</span>
              </div>
              <div className="px-4">
                <span className="text-gray-500 mr-2">Pending Admin Approval:</span>
                <span className="font-bold text-amber-600">{stats.pending_products || 0}</span>
              </div>
              <div className="px-4">
                <span className="text-gray-500 mr-2">Rejected:</span>
                <span className="font-bold text-red-600">{stats.rejected_products || 0}</span>
              </div>
              <div className="px-4">
                <span className="text-gray-500 mr-2">Low Stock:</span>
                <span className="font-bold text-orange-500">{stats.low_stock_products || 0}</span>
              </div>
              <div className="pl-4">
                <span className="text-gray-500 mr-2">Out of Stock:</span>
                <span className="font-bold text-red-600">{stats.out_of_stock_products || 0}</span>
              </div>
            </div>
          </div>

          {/* Order Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-[#0B1E3D]">Recent Store Orders</h3>
                <Link href="/merchant/orders" className="text-[#FF6B00] text-xs font-bold hover:underline">View All</Link>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 rounded-xl text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">Order #{order.order?.order_number || order.id?.substring(0, 8)}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">{order.merchant_status}</span>
                        </div>
                        <p className="text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">
                          {order.quantity}x {order.product?.title || 'Unknown Product'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-black text-gray-900 text-sm">{formatCurrency(order.total_price)}</div>
                        <div className="text-gray-400 text-[10px]">{new Date(order.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Orders Found"
                  description={verificationStatus === 'approved' ? "New store orders will appear here in real-time as customers purchase your items." : "Store verification is pending. Orders will be enabled once approved by Admin."}
                  icon="inbox"
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-base text-[#0B1E3D]">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={verificationStatus === 'approved' ? "/merchant/products/new" : "#"}
                  className={`w-full text-xs font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    verificationStatus === 'approved' 
                      ? 'bg-[#FF6B00] hover:bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {verificationStatus === 'approved' ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {verificationStatus === 'approved' ? 'Add New Product' : 'Add Product (Verification Pending)'}
                </Link>
                <button
                  disabled={verificationStatus !== 'approved'}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verificationStatus !== 'approved' && <Lock className="w-3.5 h-3.5" />}
                  Request New Category
                </button>
                <Link
                  href="/merchant/store"
                  className={`w-full text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    verificationStatus === 'approved'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {verificationStatus !== 'approved' && <Lock className="w-3.5 h-3.5" />}
                  Update Store Banner
                </Link>
                <Link
                  href="/merchant/orders"
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  View Recent Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation Drawer Backdrop & Menu Container */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sliding Panel with Full 4-Side Glowing Border */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 border-r-2 border-[#FF6B00] z-50 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              {/* Header inside Mobile Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-xs border border-gray-100 shrink-0">
                    <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight italic">
                    <span className="text-[#FF6B00] not-italic">e</span>
                    <span className="text-[#1E293B]">YuvaShop</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900"
                  aria-label="Close mobile seller menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Seller Profile Banner inside Drawer */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white shadow-md border-2 border-[#FF6B00] shadow-orange-500/20 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#FF6B00] bg-[#FF6B00] flex items-center justify-center font-black text-xs text-white shrink-0">
                  {userAvatar && !avatarError ? (
                    <img
                      src={formatImageUrl(userAvatar)}
                      alt={merchantName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    merchantName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-white truncate">{merchantName}</p>
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/30 mt-0.5">
                    Seller Hub Active
                  </span>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <nav className="space-y-1">
                {sidebarNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        if (item.onClick) item.onClick(e as any);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        item.active
                          ? 'bg-[#FF6B00] text-white shadow-md'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" /> {item.label}
                      </div>
                      {item.badge && (
                        <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Exit Seller Hub Button inside Mobile Drawer */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSignOutModal(true);
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Exit Seller Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
