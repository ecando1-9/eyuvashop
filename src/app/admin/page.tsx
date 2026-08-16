'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, Store, Package, Grid, DollarSign, CheckCircle2, 
  XCircle, Search, RefreshCw, Filter, AlertTriangle, ShieldCheck, 
  TrendingUp, Clock, ArrowUpRight, Check, Eye, FileText, ShoppingBag, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data States
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [stats, setStats] = useState<any>({
    total_gmv: 0,
    pending_merchants: 0,
    pending_products: 0,
    active_stores: 0,
    total_users: 0,
    total_orders: 0
  });

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

      // 1. Fetch Pending Merchants
      const { data: mData } = await supabase
        .from('merchant_profiles')
        .select('id, business_name, business_email, business_phone, created_at, verification_status')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // 2. Fetch Pending Products
      const { data: pData } = await supabase
        .from('products')
        .select(`
          id, title, title_te, price, submitted_at, created_at,
          store:stores(name),
          category:categories(name),
          images:product_images(url, is_primary)
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // 3. Fetch Recent Orders
      const { data: oData } = await supabase
        .from('orders')
        .select(`
          id, order_number, total_amount, status, payment_status, created_at,
          user:users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // 4. Fetch Audit Logs
      const { data: aData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (mData) setPendingMerchants(mData);
      if (pData) setPendingProducts(pData);
      if (oData) setRecentOrders(oData);
      if (aData) setAuditLogs(aData);

    } catch (err) {
      console.error('Error loading admin overview data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleApproveMerchant = async (merchantId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_merchant_status', {
        p_admin_id: user?.id,
        p_merchant_id: merchantId,
        p_status: 'approved',
        p_rejection_reason: null
      });

      if (error) throw error;
      showToastMsg('success', 'Merchant account approved successfully!');
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to approve merchant.');
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
      showToastMsg('success', 'Product approved and published!');
      loadAdminData();
    } catch (err: any) {
      showToastMsg('error', err?.message || 'Failed to approve product.');
    }
  };

  return (
    <AdminLayout 
      title="Platform Command Center" 
      subtitle="Real-time performance metrics, merchant approvals, and system-wide audit controls."
      actions={
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs animate-in fade-in duration-150 ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total GMV</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{formatCurrency(stats.total_gmv)}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Orders</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{stats.total_orders}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Stores</span>
              <Store className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{stats.active_stores}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Users</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{stats.total_users}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/40">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Sellers</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-amber-900">{stats.pending_merchants}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs space-y-1 bg-orange-50/40">
            <div className="flex items-center justify-between text-[#FF6B00]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Products</span>
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-[#FF6B00]">{stats.pending_products}</p>
          </div>
        </div>

        {/* 2-Column Approval Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Merchants */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Merchant Applications</h3>
                {stats.pending_merchants > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {stats.pending_merchants} Pending
                  </span>
                )}
              </div>
              <Link href="/admin/merchants" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingMerchants.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingMerchants.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{m.business_name}</p>
                      <p className="text-xs text-slate-400">{m.business_email} • {m.business_phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveMerchant(m.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <Link
                        href="/admin/merchants"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No pending merchant applications awaiting review.
              </div>
            )}
          </div>

          {/* Pending Products */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="font-bold text-base text-slate-900">Product Approval Queue</h3>
                {stats.pending_products > 0 && (
                  <span className="bg-orange-100 text-[#FF6B00] text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {stats.pending_products} Pending
                  </span>
                )}
              </div>
              <Link href="/admin/products" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingProducts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingProducts.map((p) => {
                  const img = p.images?.find((i: any) => i.is_primary)?.url || p.images?.[0]?.url;
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No img</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{p.title}</p>
                          <p className="text-xs text-slate-400 truncate">{p.store?.name} • {formatCurrency(p.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveProduct(p.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <Link
                          href="/admin/products"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                All submitted products have been reviewed and published.
              </div>
            )}
          </div>
        </div>

        {/* 2-Column: Recent Orders & Audit Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Recent Customer Purchases</h3>
              </div>
              <Link href="/admin/orders" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                Manage Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs font-bold border-b border-slate-100">
                      <th className="pb-2">Order #</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">#{o.order_number}</td>
                        <td className="py-3 font-semibold text-slate-800">{o.user?.full_name || o.user?.email || 'Customer'}</td>
                        <td className="py-3 font-black text-slate-900">{formatCurrency(o.total_amount)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">No recent orders recorded.</div>
            )}
          </div>

          {/* System Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Live Audit Trail</h3>
              </div>
              <Link href="/admin/audit-log" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                Full Logs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action || 'System Action'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      {log.entity_type}: <span className="font-mono text-slate-700">{log.entity_id?.slice(0, 8)}...</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
