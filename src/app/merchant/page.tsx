'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Package, TrendingUp, DollarSign, Plus, Clock, AlertTriangle, ChevronRight, Eye, RefreshCw, CheckCircle2,
  Send, ShieldCheck, Check, Sparkles, MapPin, Phone, Mail, User, Tag, Calendar, FileText, ArrowRight, X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';

export default function MerchantDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
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
  
  const [merchantProfile, setMerchantProfile] = useState<any | null>(null);
  const [store, setStore] = useState<any | null>(null);
  const [lastPublishedProduct, setLastPublishedProduct] = useState<any | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [submittingAccess, setSubmittingAccess] = useState(false);
  const [accessForm, setAccessForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [resubmitting, setResubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stable supabase ref — prevents triggering effects on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const loadMerchantData = async () => {
    if (!user) return;
    try {
      const { data: mProfile } = await supabase
        .from('merchant_profiles')
        .select('id, business_name, business_email, business_phone, business_address, verification_status, can_publish, rejection_reason, first_product_published_at, last_published_product_id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (mProfile) {
        setMerchantProfile(mProfile);
        setAccessForm({
          name: mProfile.business_name || profile?.full_name || '',
          phone: mProfile.business_phone || profile?.phone || '',
          email: mProfile.business_email || user.email || '',
          address: mProfile.business_address || ''
        });

        // Get store ID first, then run stats + orders + last published in parallel
        const { data: stores } = await supabase
          .from('stores')
          .select('id, name, logo_url')
          .eq('merchant_id', mProfile.id)
          .maybeSingle();

        if (stores) {
          setStore(stores);
          const storeId = stores.id;
          // Run all 3 queries in parallel instead of sequentially
          const [statsRes, ordersRes, lastPubRes] = await Promise.all([
            // Stats via RPC — wrapped in Promise.resolve so .catch() is available
            Promise.resolve(supabase.rpc('get_merchant_dashboard_stats', { p_merchant_id: mProfile.id }))
              .then(r => r.data)
              .catch(() => null),
            // Recent orders
            supabase.from('order_items')
              .select('id, quantity, total_price, merchant_status, created_at, product:products(title), order:orders(order_number)')
              .eq('store_id', stores.id)
              .order('created_at', { ascending: false })
              .limit(5),
            // Latest published product
            supabase.from('products')
              .select('id, title, title_te, price, created_at, updated_at, status, approval_status, category:categories(name)')
              .eq('store_id', stores.id)
              .eq('status', 'published')
              .eq('approval_status', 'approved')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (statsRes) setStats(statsRes);
          if (ordersRes.data) setOrders(ordersRes.data);
          if (lastPubRes.data) setLastPublishedProduct(lastPubRes.data);
        }
      } else {
        // Pre-fill from user auth
        setAccessForm({
          name: profile?.full_name || '',
          phone: profile?.phone || '',
          email: user.email || '',
          address: ''
        });
      }
    } catch (err) {
      console.error("Error loading merchant data:", err);
    }
  };

  // Only re-run when the user ID changes (stable dep), not on every profile update
  useEffect(() => {
    if (user?.id) {
      loadMerchantData();
    }
  }, [user?.id]);

  const handleAccessRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!accessForm.name.trim() || !accessForm.phone.trim() || !accessForm.email.trim() || !accessForm.address.trim()) {
      alert("Please fill in all required fields (Name, Mobile Number, Email, and Address).");
      return;
    }

    try {
      setSubmittingAccess(true);

      // Direct upsert to merchant_profiles
      const { data: upsertData, error: upsertErr } = await supabase
        .from('merchant_profiles')
        .upsert({
          user_id: user.id,
          business_name: accessForm.name.trim(),
          business_email: accessForm.email.trim(),
          business_phone: accessForm.phone.trim(),
          business_address: accessForm.address.trim(),
          verification_status: 'pending',
          can_publish: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertErr) {
        console.warn("Direct upsert error, trying update fallback:", upsertErr.message);
        await supabase
          .from('merchant_profiles')
          .update({
            business_name: accessForm.name.trim(),
            business_email: accessForm.email.trim(),
            business_phone: accessForm.phone.trim(),
            business_address: accessForm.address.trim(),
            verification_status: 'pending',
            rejection_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Ensure store entry exists
      const targetMerchantId = upsertData?.id || merchantProfile?.id;
      if (targetMerchantId) {
        await supabase
          .from('stores')
          .upsert({
            merchant_id: targetMerchantId,
            name: accessForm.name.trim(),
            slug: accessForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.id.slice(0, 4),
            phone: accessForm.phone.trim(),
            email: accessForm.email.trim(),
            city: accessForm.address.trim().split(',')[0] || 'Local'
          }, { onConflict: 'merchant_id' });
      }

      setShowAccessModal(false);
      await loadMerchantData();
      setToastMsg({ type: 'success', text: 'Access request successfully submitted! Admin has received your request.' });
      setTimeout(() => setToastMsg(null), 6000);
    } catch (err: any) {
      alert("Error submitting access request: " + err.message);
    } finally {
      setSubmittingAccess(false);
    }
  };

  const handleResubmitApplication = async () => {
    if (!merchantProfile?.id) return;
    setResubmitting(true);
    try {
      const { error } = await supabase
        .from('merchant_profiles')
        .update({
          verification_status: 'pending',
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', merchantProfile.id);

      if (error) throw error;
      
      await loadMerchantData();
      setToastMsg({ type: 'success', text: 'Application re-submitted! Our administrators have been notified.' });
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      alert("Failed to re-submit application: " + err.message);
    } finally {
      setResubmitting(false);
    }
  };

  const storeName = store?.name || merchantProfile?.business_name || profile?.full_name || user?.email?.split('@')[0]?.replace(/[0-9]/g, '') || "Merchant Store";
  const verificationStatus = merchantProfile?.verification_status;
  const canPublish = merchantProfile?.can_publish || verificationStatus === 'approved';
  const hasPublishedProduct = !!lastPublishedProduct || (stats.published_products > 0);

  return (
    <MerchantLayout title={`Welcome back, ${storeName}`} subtitle="Manage publishing permissions, store performance, and catalog items.">
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMsg && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs animate-in fade-in ${
            toastMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ADM-AUDIT-003: AWAITING ACCOUNT & PUBLISHING PERMISSION SECTION */}
        {/* ==================================================================== */}
        
        {/* STATE 1: No Access Request Yet */}
        {!merchantProfile && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-orange-200">
                  Initial Setup
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">Publishing Access Required</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To start publishing products to the eYuvaShop marketplace, submit an initial access request with your contact and address details for Administrator review.
              </p>
            </div>
            <button
              onClick={() => setShowAccessModal(true)}
              className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" /> Access Request
            </button>
          </div>
        )}

        {/* STATE 2: Access Request Submitted (Pending Admin Approval) */}
        {merchantProfile && verificationStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-amber-950 text-base">Awaiting Account Verification</h3>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Pending Admin Approval
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                  Your publishing access request has been submitted to the Admin. Once approved, you will be granted immediate permission to publish products to the marketplace.
                </p>
                {merchantProfile.business_address && (
                  <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-amber-900 font-medium">
                    <span><strong>Applicant:</strong> {merchantProfile.business_name}</span>
                    <span><strong>Mobile:</strong> {merchantProfile.business_phone}</span>
                    <span><strong>Address:</strong> {merchantProfile.business_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleResubmitApplication}
                disabled={resubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resubmitting ? 'animate-spin' : ''}`} />
                <span>{resubmitting ? 'Submitting...' : 'Re-request Approval / Ping Admin'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2B: Application Rejected (Action Required) */}
        {merchantProfile && verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shrink-0 font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-red-950 text-base">Store Application Requires Updates</h3>
                  <span className="bg-red-200 text-red-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                {merchantProfile.rejection_reason && (
                  <p className="text-xs text-red-900 font-bold mt-1">
                    Admin Feedback: <span className="font-normal italic text-red-800">"{merchantProfile.rejection_reason}"</span>
                  </p>
                )}
                <p className="text-xs text-red-700 leading-relaxed">
                  Please update your Store details and click re-submit below for Administrator re-evaluation.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAccessModal(true)}
                className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
              >
                Update Details
              </button>
              <button
                onClick={handleResubmitApplication}
                disabled={resubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resubmitting ? 'animate-spin' : ''}`} />
                <span>{resubmitting ? 'Submitting...' : 'Re-request Approval'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 3 & 4: Admin Approved Initial Access */}
        {canPublish && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Admin has granted publishing access</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3" /> Access Granted
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admin approval is only required for initial access. Adding subsequent new products and modifying prices do not require Admin approval.
                  </p>
                </div>
              </div>

              {/* Action Button: "Publish" -> transitions to "Published" once products exist */}
              <div className="shrink-0">
                {hasPublishedProduct ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-xs inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Published
                    </span>
                    <Link
                      href="/merchant/products/new"
                      className="px-4 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Product
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/merchant/products/new"
                    className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Publish First Product
                  </Link>
                )}
              </div>
            </div>

            {/* If a product is published, show product name, category, and last published date per ADM-AUDIT-003 */}
            {lastPublishedProduct && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Last Published Product
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900">{lastPublishedProduct.title}</h4>
                    {lastPublishedProduct.title_te && (
                      <span className="text-xs font-bold text-[#FF6B00]">({lastPublishedProduct.title_te})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Category: <strong className="text-slate-700 font-semibold">{lastPublishedProduct.category?.name || 'General'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Published on: <strong className="text-slate-700 font-semibold">{new Date(lastPublishedProduct.created_at).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>

                <Link
                  href="/merchant/products"
                  className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1 shrink-0"
                >
                  View in Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
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
                Seller Hub
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

        {/* Access Request Form Modal (Name, Mobile, Email, Address) */}
        {showAccessModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Merchant Access Request</h3>
                    <p className="text-[11px] text-slate-500">Provide your information to request initial publishing permission</p>
                  </div>
                </div>
                <button onClick={() => setShowAccessModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAccessRequestSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name / Business Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={accessForm.name}
                      onChange={(e) => setAccessForm({ ...accessForm, name: e.target.value })}
                      placeholder="E.g., Yuva Enterprises"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={accessForm.phone}
                        onChange={(e) => setAccessForm({ ...accessForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={accessForm.email}
                        onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                        placeholder="seller@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business / Store Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={3}
                      required
                      value={accessForm.address}
                      onChange={(e) => setAccessForm({ ...accessForm, address: e.target.value })}
                      placeholder="Enter complete street address, city, state, and pin code..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80 text-[11px] text-orange-800 space-y-1">
                  <p className="font-bold">Publishing Permission Policy (ADM-AUDIT-003):</p>
                  <p>Admin approval is required only for initial publishing access. Once approved, you can add new products and adjust prices anytime without repeated approval.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAccessModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAccess}
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingAccess ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{submittingAccess ? 'Submitting Request...' : 'Send Access Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
