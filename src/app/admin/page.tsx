'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldAlert, Users, Store, Package, Grid, DollarSign, CheckCircle2, 
  XCircle, Search, RefreshCw, Filter, AlertTriangle, ShieldCheck, 
  TrendingUp, Clock, LogOut, Menu, X, ArrowUpRight, Check, Eye, FileText, ClipboardList
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SignOutModal } from '@/components/common/SignOutModal';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

type TabType = 'overview' | 'merchants' | 'products' | 'users' | 'revenue';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data States
  const [merchants, setMerchants] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [stats, setStats] = useState<any>({
    total_gmv: 0,
    pending_merchants: 0,
    pending_products: 0,
    active_stores: 0,
    total_users: 0,
    total_orders: 0
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const showToastMsg = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 0. Fetch Dashboard Stats from RPC
      const { data: statsData } = await supabase.rpc('get_admin_dashboard_stats');
      if (statsData) {
        setStats(statsData);
      }

      // 1. Fetch Merchants
      const { data: merchantData } = await supabase
        .from('merchant_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch Users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Fetch Products
      const { data: productData } = await supabase
        .from('products')
        .select('id, title, price, status, approval_status, created_at, store:stores(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      // 4. Fetch Orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, user:users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      // 5. Fetch Audit Logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (merchantData) setMerchants(merchantData);
      if (userData) setUsersList(userData);
      if (productData) setProductsList(productData);
      if (orderData) setOrdersList(orderData);
      if (auditData) setAuditLogs(auditData);
    } catch {
      showToastMsg('error', 'Failed to load admin telemetry data.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Actions
  const handleApproveMerchant = async (merchantId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_merchant_status', {
        p_admin_id: user?.id,
        p_merchant_id: merchantId,
        p_status: 'approved',
        p_rejection_reason: null
      });

      if (error) throw error;

      showToastMsg('success', 'Merchant store approved successfully!');
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to approve merchant.');
    }
  };

  const handleRejectMerchant = async (merchantId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_merchant_status', {
        p_admin_id: user?.id,
        p_merchant_id: merchantId,
        p_status: 'rejected',
        p_rejection_reason: 'Admin rejected'
      });

      if (error) throw error;

      showToastMsg('success', 'Merchant store application rejected.');
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to reject merchant.');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: nextRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      showToastMsg('success', `User role updated to ${nextRole.toUpperCase()}`);
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to update user role.');
    }
  };
  
  const handleApproveProduct = async (productId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_product_status', {
        p_admin_id: user?.id,
        p_product_id: productId,
        p_approval_status: 'approved',
        p_rejection_reason: null
      });
      if (error) throw error;
      showToastMsg('success', 'Product approved successfully!');
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to approve product.');
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesFilter = merchantFilter === 'all' || (m.verification_status || 'pending') === merchantFilter;
    const matchesQuery = searchQuery === '' || 
      (m.business_name && m.business_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const filteredUsers = usersList.filter(u => {
    return searchQuery === '' ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: ShieldAlert, href: '/admin' },
    { id: 'merchants', label: 'Merchants', icon: Store, badge: stats.pending_merchants > 0 ? `${stats.pending_merchants} Pending` : undefined, href: '/admin/merchants' },
    { id: 'products', label: 'Products', icon: Package, badge: stats.pending_products > 0 ? `${stats.pending_products} Pending` : undefined, href: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: ClipboardList, href: '/admin/orders' },
    { id: 'categories', label: 'Categories', icon: Grid, href: '/admin/categories' },
    { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
    { id: 'audit-log', label: 'Audit Log', icon: FileText, href: '/admin/audit-log' },
    { id: 'revenue', label: 'Platform Revenue', icon: DollarSign, href: '/admin/revenue' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center gap-2 border animate-in slide-in-from-top-3 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-red-950 text-red-300 border-red-500/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
          {toast.message}
        </div>
      )}

      {/* PC Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-900 p-6 flex flex-col justify-between hidden lg:flex shrink-0">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/20">
              <Image src={LOGO_URL} alt="eYuvaShop Logo" fill className="object-cover" />
            </div>
            <span className="font-extrabold text-lg text-white">
              Admin<span className="text-red-500">Control</span>
            </span>
          </Link>

          <nav className="space-y-1 text-xs font-bold">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    // Keep the single page app behavior if they just click the tab
                    if (['overview', 'merchants', 'products', 'users', 'revenue'].includes(item.id)) {
                      e.preventDefault();
                      setActiveTab(item.id as TabType);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-red-950 via-red-900 to-black text-white border border-red-500/40 shadow-lg shadow-red-950/50' 
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-red-500' : 'text-gray-500'}`} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-900 space-y-3">
          <button 
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white p-2 rounded-xl transition-colors w-full"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} /> Refresh Telemetry
          </button>
          <button 
            onClick={() => setShowSignOutModal(true)} 
            className="flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-950/50 p-2.5 rounded-xl transition-colors w-full text-left border border-red-900/30"
          >
            <LogOut className="w-4 h-4" /> Exit Admin Control
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-black border-b border-gray-900 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-400 hover:text-white bg-gray-900 rounded-xl lg:hidden border border-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-black text-base sm:text-lg text-white">Platform Governance Center</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 hidden sm:inline">All Systems Operational</span>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 md:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Telemetry Stat Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-gray-800 shadow-md">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-medium">Total Platform GMV</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{formatCurrency(stats.total_gmv || 0)}</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Live Transaction Volume
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-gray-800 shadow-md">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-medium">Pending Merchant Approvals</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-black text-amber-400">{stats.pending_merchants || 0}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Requires Admin Action</p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-gray-800 shadow-md">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-medium">Active Seller Stores</span>
                    <Store className="w-4 h-4 text-[#FF6B00]" />
                  </div>
                  <h3 className="text-2xl font-black text-[#FF6B00]">{stats.active_stores || 0}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Verified Storefronts</p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-gray-800 shadow-md">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-medium">Total Registered Users</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{stats.total_users || 0}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Accounts on Platform</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions Panel */}
                <div className="bg-gradient-to-r from-red-950/40 via-gray-900 to-black p-6 rounded-3xl border border-red-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Merchant Application Requests</h3>
                      <p className="text-xs text-gray-400">Review pending seller onboardings</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('merchants')}
                      className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      View All ({stats.pending_merchants}) <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {stats.pending_merchants > 0 ? (
                    <div className="divide-y divide-gray-800">
                      {merchants.filter(m => (m.verification_status || 'pending') === 'pending').slice(0, 5).map((m) => (
                        <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-extrabold text-sm text-white">{m.business_name || 'Unnamed Store'}</p>
                            <p className="text-xs text-gray-400">{m.email} • Requested {new Date(m.created_at || Date.now()).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveMerchant(m.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Store
                            </button>
                            <button
                              onClick={() => handleRejectMerchant(m.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-extrabold text-xs flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 bg-black/40 rounded-2xl border border-gray-800">
                      ✨ No pending merchant verification requests at this time.
                    </div>
                  )}
                </div>
                
                {/* Audit Logs */}
                <div className="bg-gradient-to-r from-gray-900 to-black p-6 rounded-3xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Recent System Activity</h3>
                      <p className="text-xs text-gray-400">Audit logs tracking important events</p>
                    </div>
                    <Link href="/admin/audit-log" className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1">
                      Full Log <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  
                  {auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/50 flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white capitalize">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 break-words">
                            {log.entity_type} • ID: {log.entity_id?.substring(0, 8)}...
                            {log.metadata && ` • ${JSON.stringify(log.metadata).substring(0, 50)}...`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 bg-black/40 rounded-2xl border border-gray-800">
                      No recent activity logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MERCHANTS */}
          {activeTab === 'merchants' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white">Merchant Application Governance</h2>
                  <p className="text-xs text-gray-400">Approve or reject seller storefront registrations</p>
                </div>

                <div className="flex items-center gap-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setMerchantFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                        merchantFilter === filter
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Merchant Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores by business name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Merchants Table */}
              <div className="bg-black rounded-2xl border border-gray-900 overflow-hidden">
                {filteredMerchants.length > 0 ? (
                  <div className="divide-y divide-gray-900">
                    {filteredMerchants.map((m) => {
                      const status = m.verification_status || 'pending';
                      return (
                        <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-white">{m.business_name || 'Unnamed Business'}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                status === 'rejected' ? 'bg-red-950 text-red-400 border border-red-800' :
                                'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                              }`}>
                                {status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{m.email} • Account ID: {m.id.substring(0, 8)}...</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {status !== 'approved' && (
                              <button
                                onClick={() => handleApproveMerchant(m.id)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectMerchant(m.id)}
                                className="px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-extrabold text-xs flex items-center gap-1.5 transition-all"
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No merchant stores found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">Product Catalog Moderation</h2>
                <p className="text-xs text-gray-400">Live products registered on eYuvaShop</p>
              </div>

              <div className="bg-black rounded-2xl border border-gray-900 overflow-hidden">
                {productsList.length > 0 ? (
                  <div className="divide-y divide-gray-900">
                    {productsList.map((p) => (
                      <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-sm text-white">{p.title}</p>
                          <p className="text-gray-400">{formatCurrency(p.price)} • Store: {p.store?.name || 'Platform Seller'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${p.approval_status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                            {p.approval_status || 'pending'}
                          </span>
                          {p.approval_status !== 'approved' && (
                            <button onClick={() => handleApproveProduct(p.id)} className="text-emerald-400 hover:text-emerald-300 font-bold">Approve</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Products Registered Yet"
                    description="Products added by approved sellers will appear here for platform moderation."
                    icon="inbox"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">Platform User Governance</h2>
                <p className="text-xs text-gray-400">Manage user accounts and role permissions</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user accounts by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="bg-black rounded-2xl border border-gray-900 overflow-hidden">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-gray-900">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-extrabold text-sm text-white">{u.full_name || 'User'}</p>
                          <p className="text-gray-400">{u.email} • Joined {new Date(u.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin' ? 'bg-red-950 text-red-400 border border-red-800' :
                            u.role === 'merchant' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                            'bg-gray-900 text-gray-300 border border-gray-800'
                          }`}>
                            {u.role || 'customer'}
                          </span>

                          <button
                            onClick={() => handleToggleUserRole(u.id, u.role || 'customer')}
                            className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-[11px] border border-gray-800 transition-all"
                          >
                            Toggle Admin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No user accounts found matching your query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REVENUE */}
          {activeTab === 'revenue' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">Platform Revenue & Order History</h2>
                <p className="text-xs text-gray-400">Total processed GMV: {formatCurrency(stats.total_gmv || 0)}</p>
              </div>

              <div className="bg-black rounded-2xl border border-gray-900 overflow-hidden">
                {ordersList.length > 0 ? (
                  <div className="divide-y divide-gray-900">
                    {ordersList.map((o) => (
                      <div key={o.id} className="p-4 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-sm text-white">Order #{o.id.substring(0, 8)}</p>
                          <p className="text-gray-400">{o.user?.full_name || o.user?.email || 'Customer'} • {new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-emerald-400">{formatCurrency(o.total_amount)}</p>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Platform Orders Processed Yet"
                    description="Customer orders across all stores will be listed here."
                    icon="inbox"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Menu Backdrop & Drawer Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-black h-full shadow-2xl flex flex-col justify-between p-5 border-r border-red-500/40 z-50 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white/10 shrink-0">
                    <Image src={LOGO_URL} alt="eYuvaShop Logo" fill className="object-cover" />
                  </div>
                  <span className="font-extrabold text-base text-white">
                    Admin<span className="text-red-500">Control</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-gray-900 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1 text-xs font-bold">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        if (['overview', 'merchants', 'products', 'users', 'revenue'].includes(item.id)) {
                          e.preventDefault();
                          setActiveTab(item.id as TabType);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                        active 
                          ? 'bg-gradient-to-r from-red-950 via-red-900 to-black text-white border border-red-500/40 shadow-lg' 
                          : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-red-500' : 'text-gray-500'}`} />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-gray-900 space-y-3">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSignOutModal(true);
                }} 
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-950/50 p-2.5 rounded-xl transition-colors w-full text-left border border-red-900/30"
              >
                <LogOut className="w-4 h-4" /> Exit Admin Control
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
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
