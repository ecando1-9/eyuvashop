'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Package, TrendingUp, DollarSign, Plus, Clock, AlertTriangle, ChevronRight, Eye
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';

export default function MerchantDashboard() {
  const { user, profile } = useAuth();
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
  
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
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
          if (mProfile.business_name) setBusinessName(mProfile.business_name);
          if (mProfile.verification_status) setVerificationStatus(mProfile.verification_status as any);
          
          const { data: statsData } = await supabase.rpc('get_merchant_dashboard_stats', { p_merchant_id: mProfile.id });
          if (statsData) {
            setStats(statsData);
          }
          
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

  return (
    <MerchantLayout title={`Welcome back, ${merchantName}`} subtitle="Here is what is happening with your store today.">
      <div className="space-y-6">
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
                All seller features are active, and your products will be published automatically once approved.
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
                Your store application requires updates. Please check your Store Profile details and re-submit.
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.today_revenue)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Orders</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600">{stats.pending_orders}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.total_products}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.monthly_revenue)}</p>
          </div>
        </div>

        {/* Action Cards & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900">Recent Customer Orders</h3>
              <Link href="/merchant/orders" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                View All Orders <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {orders.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">{item.product?.title || 'Product'}</p>
                      <p className="text-xs text-gray-400">Order #{item.order?.order_number} • Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-gray-900">{formatCurrency(item.total_price)}</p>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                        {item.merchant_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs font-medium">
                No orders received yet. Orders will appear here as customers place purchases.
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                Quick Actions
              </span>
              <h3 className="text-xl font-black">Expand Your Catalog</h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Add new items to your store catalog to attract more buyers and increase daily store revenues.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/merchant/products/new"
                className="w-full py-3 bg-white text-[#FF6B00] hover:bg-orange-50 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Add Product Now
              </Link>
              <Link
                href="/merchant/store"
                className="w-full py-2.5 bg-orange-600/60 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4" /> Edit Store Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
