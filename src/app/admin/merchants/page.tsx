"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { 
  Search, CheckCircle, XCircle, Eye, AlertCircle, Building, User, Store,
  X, Ban, ShieldCheck, CreditCard, Check, ShoppingBag, Package, Star, Award,
  ArrowUpDown, Save, ExternalLink, Calendar, Phone, Mail, MapPin, Tag
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMerchantsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  
  // Drill-down inspection state
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'orders' | 'products'>('profile');
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Priority & Action states
  const [priorityInput, setPriorityInput] = useState<number>(0);
  const [savingPriority, setSavingPriority] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionModal, setActionModal] = useState<{ open: boolean; type: 'approve' | 'reject' | 'suspend' | null }>({
    open: false, type: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = ["All", "Pending", "Active", "Suspended", "Rejected"];
  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      
      // Step 1: Query merchant_profiles
      const { data: mProfiles, error: mError } = await supabase
        .from("merchant_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (mError) {
        console.error("Error fetching merchant_profiles:", mError);
        throw mError;
      }

      if (!mProfiles || mProfiles.length === 0) {
        setMerchants([]);
        return;
      }

      // Step 2: Fetch corresponding users and stores in parallel
      const userIds = mProfiles.map(m => m.user_id).filter(Boolean);
      const merchantIds = mProfiles.map(m => m.id).filter(Boolean);

      const [usersRes, storesRes] = await Promise.all([
        supabase.from("users").select("id, full_name, email, avatar_url, phone, is_active").in("id", userIds),
        supabase.from("stores").select("*").in("merchant_id", merchantIds)
      ]);

      const userMap = new Map((usersRes.data || []).map(u => [u.id, u]));
      const storeMap = new Map((storesRes.data || []).map(s => [s.merchant_id, s]));

      const combinedMerchants = mProfiles.map(m => ({
        ...m,
        user: userMap.get(m.user_id) || null,
        store: storeMap.get(m.id) || null
      }));

      // Sort by priority DESC if exists, then created_at DESC
      combinedMerchants.sort((a, b) => {
        const pA = a.priority || a.store?.priority || 0;
        const pB = b.priority || b.store?.priority || 0;
        if (pB !== pA) return pB - pA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMerchants(combinedMerchants);
    } catch (err: any) {
      console.error("Failed to fetch merchants:", err?.message || err);
      // Fallback
      const { data: fallbackData } = await supabase.from("merchant_profiles").select("*");
      setMerchants(fallbackData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchMerchants();
    }
  }, [user, isAdmin]);

  // Load drill-down details (orders + products) when a merchant is selected
  const handleSelectMerchant = async (merchant: any) => {
    setSelectedMerchant(merchant);
    setPriorityInput(merchant.priority || merchant.store?.priority || 0);
    setDetailTab('profile');
    setLoadingDetails(true);

    try {
      const storeObj = Array.isArray(merchant.store) ? merchant.store[0] : merchant.store;
      const storeId = storeObj?.id;

      if (storeId) {
        // Fetch merchant orders
        const { data: ordersData } = await supabase
          .from('order_items')
          .select(`
            id, quantity, unit_price, total_price, merchant_status, created_at,
            product:products(title),
            order:orders(order_number, status, payment_status, created_at, address_snapshot)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(25);

        setMerchantOrders(ordersData || []);

        // Fetch merchant products
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            id, title, title_te, slug, price, compare_at_price, status, approval_status, stock_quantity, search_priority, is_trending, is_featured, created_at,
            images:product_images(url, is_primary)
          `)
          .eq('store_id', storeId)
          .is('deleted_at', null)
          .order('search_priority', { ascending: false })
          .order('created_at', { ascending: false });

        setMerchantProducts(productsData || []);
      } else {
        setMerchantOrders([]);
        setMerchantProducts([]);
      }
    } catch (err) {
      console.error("Error loading merchant drill-down:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSavePriority = async () => {
    if (!selectedMerchant) return;
    try {
      setSavingPriority(true);
      const newPriority = Number(priorityInput) || 0;

      // Update merchant_profiles priority
      await supabase
        .from('merchant_profiles')
        .update({ priority: newPriority })
        .eq('id', selectedMerchant.id);

      // Also update associated store priority
      const storeObj = Array.isArray(selectedMerchant.store) ? selectedMerchant.store[0] : selectedMerchant.store;
      if (storeObj?.id) {
        await supabase
          .from('stores')
          .update({ priority: newPriority })
          .eq('id', storeObj.id);
      }

      // Update local state
      setSelectedMerchant({ ...selectedMerchant, priority: newPriority });
      await fetchMerchants();
      alert(`Priority updated to Level ${newPriority} successfully!`);
    } catch (err: any) {
      alert("Error saving priority: " + err.message);
    } finally {
      setSavingPriority(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedMerchant || !actionModal.type) return;

    try {
      setActionLoading(true);
      
      let newStatus = actionModal.type === 'approve' ? 'approved' 
                    : actionModal.type === 'reject' ? 'rejected' 
                    : 'suspended';

      const { error } = await supabase.rpc('admin_update_merchant_status', {
        p_admin_id: user?.id,
        p_merchant_id: selectedMerchant.id,
        p_status: newStatus,
        p_rejection_reason: rejectionReason
      });

      if (error) {
        console.warn("RPC status update failed, running direct table update fallback:", error.message);
        
        // Direct update to merchant_profiles
        await supabase
          .from('merchant_profiles')
          .update({
            verification_status: newStatus,
            can_publish: newStatus === 'approved',
            rejection_reason: newStatus === 'rejected' ? rejectionReason : null,
            approved_at: newStatus === 'approved' ? new Date().toISOString() : selectedMerchant.approved_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedMerchant.id);

        // Direct update to stores
        const storeObj = Array.isArray(selectedMerchant.store) ? selectedMerchant.store[0] : selectedMerchant.store;
        if (storeObj?.id) {
          await supabase
            .from('stores')
            .update({
              status: newStatus === 'approved' ? 'active' : 'suspended',
              is_active: newStatus === 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', storeObj.id);
        }
      }

      await fetchMerchants();
      setActionModal({ open: false, type: null });
      setRejectionReason("");
      setSelectedMerchant(null);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    if (activeTab === "Pending" && merchant.verification_status !== "pending") return false;
    if (activeTab === "Active" && merchant.verification_status !== "approved") return false;
    if (activeTab === "Suspended" && merchant.verification_status !== "suspended") return false;
    if (activeTab === "Rejected" && merchant.verification_status !== "rejected") return false;

    if (search) {
      const q = search.toLowerCase();
      const matchName = merchant.business_name?.toLowerCase().includes(q);
      const matchEmail = merchant.business_email?.toLowerCase().includes(q);
      const matchUser = merchant.user?.full_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUser) return false;
    }

    return true;
  });

  const stats = {
    total: merchants.length,
    pending: merchants.filter(m => m.verification_status === "pending").length,
    active: merchants.filter(m => m.verification_status === "approved").length,
    rejected: merchants.filter(m => m.verification_status === "rejected").length,
  };

  if (authLoading) return null;

  return (
    <AdminLayout title="Merchant Management & Store Priorities" subtitle="Manage seller accounts, inspection drill-down, orders, product catalogs, and search ranking priority">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Merchants</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Verification</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Sellers</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected Accounts</p>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab ? "bg-[#FF6B00] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Business / Merchant</th>
                  <th className="p-4">Storefront</th>
                  <th className="p-4">Priority Rank</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Drill-Down Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading merchants...</td></tr>
                ) : filteredMerchants.length > 0 ? (
                  filteredMerchants.map((m) => {
                    const storeObj = Array.isArray(m.store) ? m.store[0] : m.store;
                    const priorityVal = m.priority || storeObj?.priority || 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{m.business_name}</p>
                          <p className="text-[11px] text-slate-400">{m.business_email} • {m.user?.full_name || 'Owner'}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{storeObj?.name || 'No store setup'}</p>
                          {storeObj?.slug && <p className="text-[10px] text-slate-400 font-mono">/store/{storeObj.slug}</p>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                            priorityVal > 0 ? 'bg-orange-100 text-[#FF6B00] border border-orange-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Award className="w-3.5 h-3.5" /> Priority {priorityVal}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            m.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            m.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            m.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {m.verification_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSelectMerchant(m)}
                            className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Full Account
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No merchants found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comprehensive Merchant Drill-Down Modal */}
        {selectedMerchant && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] font-black text-lg flex items-center justify-center border border-[#FF6B00]/20">
                    {selectedMerchant.business_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-base">{selectedMerchant.business_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedMerchant.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        selectedMerchant.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedMerchant.verification_status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{selectedMerchant.business_email} • Registered on {new Date(selectedMerchant.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedMerchant(null); setActionModal({ open: false, type: null }); }} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs inside Drill-Down */}
              <div className="border-b border-slate-200 bg-white px-6 flex gap-6 text-xs font-bold">
                <button
                  onClick={() => setDetailTab('profile')}
                  className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                    detailTab === 'profile' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building className="w-4 h-4" /> Profile & Priority Settings
                </button>
                <button
                  onClick={() => setDetailTab('orders')}
                  className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                    detailTab === 'orders' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Merchant Orders ({merchantOrders.length})
                </button>
                <button
                  onClick={() => setDetailTab('products')}
                  className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                    detailTab === 'products' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" /> Product Catalog ({merchantProducts.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
                {actionModal.type ? (
                  <div className="space-y-4 max-w-lg mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-black text-slate-900 text-sm uppercase">
                      Confirm {actionModal.type} Action for {selectedMerchant.business_name}
                    </h4>
                    <p className="text-slate-600">
                      Are you sure you want to change the status of this merchant account to <strong>{actionModal.type}</strong>?
                    </p>

                    {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Reason / Feedback (Visible to seller)</label>
                        <textarea
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Specify why the account is being rejected or suspended..."
                          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setActionModal({ open: false, type: null })} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateStatus}
                        disabled={actionLoading || ((actionModal.type === 'reject' || actionModal.type === 'suspend') && !rejectionReason.trim())}
                        className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Confirm Status Change'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: Profile & Priority */}
                    {detailTab === 'profile' && (
                      <div className="space-y-6">
                        {/* Priority Ranking Card */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-[#FF6B00]" />
                              <h4 className="font-extrabold text-sm text-slate-900">Merchant Search & Store Priority Ranking</h4>
                            </div>
                            <p className="text-slate-600 text-xs">
                              Higher priority ranks this merchant's products first when users search or browse duplicate/competing items. (E.g., Priority 10 ranks higher than Priority 1).
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={999}
                              value={priorityInput}
                              onChange={(e) => setPriorityInput(parseInt(e.target.value) || 0)}
                              className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-center focus:ring-2 focus:ring-[#FF6B00] outline-none"
                            />
                            <button
                              onClick={handleSavePriority}
                              disabled={savingPriority}
                              className="px-4 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingPriority ? 'Saving...' : 'Set Priority'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Merchant Credentials Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <h5 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                              <span>Access Request & Contact Info</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                selectedMerchant.can_publish ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {selectedMerchant.can_publish ? 'Publishing Access: Active' : 'Publishing: Pending'}
                              </span>
                            </h5>
                            <div className="space-y-2">
                              <p className="flex items-center gap-2 text-slate-700"><User className="w-4 h-4 text-slate-400" /> <strong>Applicant Name:</strong> {selectedMerchant.business_name}</p>
                              <p className="flex items-center gap-2 text-slate-700"><Mail className="w-4 h-4 text-slate-400" /> <strong>Email:</strong> {selectedMerchant.business_email}</p>
                              <p className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" /> <strong>Mobile:</strong> {selectedMerchant.business_phone || 'N/A'}</p>
                              <p className="flex items-start gap-2 text-slate-700"><MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /> <span><strong>Address:</strong> {selectedMerchant.business_address || 'Address not provided'}</span></p>
                              <p className="flex items-center gap-2 text-slate-700"><Tag className="w-4 h-4 text-slate-400" /> <strong>Tax ID:</strong> {selectedMerchant.tax_id || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <h5 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Storefront Presence</h5>
                            <div className="space-y-2">
                              <p className="text-slate-700"><strong>Store Name:</strong> {selectedMerchant.store?.name || 'No store setup'}</p>
                              {selectedMerchant.store?.slug && (
                                <p className="text-slate-700 flex items-center gap-1">
                                  <strong>Store URL:</strong> 
                                  <a href={`/store/${selectedMerchant.store.slug}`} target="_blank" className="text-[#FF6B00] font-mono hover:underline flex items-center gap-1">
                                    /store/{selectedMerchant.store.slug} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </p>
                              )}
                              <p className="text-slate-700"><strong>Rating:</strong> {selectedMerchant.store?.rating || '0.0'} ★ ({selectedMerchant.store?.rating_count || 0} reviews)</p>
                            </div>
                          </div>
                        </div>

                        {/* Rejection Feedback if any */}
                        {selectedMerchant.rejection_reason && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1">
                            <p className="font-bold">Previous Rejection Reason:</p>
                            <p className="italic font-sans">"{selectedMerchant.rejection_reason}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: Merchant Orders */}
                    {detailTab === 'orders' && (
                      <div className="space-y-4">
                        {loadingDetails ? (
                          <p className="p-8 text-center text-slate-400">Loading merchant order history...</p>
                        ) : merchantOrders.length > 0 ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="p-3">Order #</th>
                                  <th className="p-3">Item Title</th>
                                  <th className="p-3">Qty & Price</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {merchantOrders.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">#{item.order?.order_number}</td>
                                    <td className="p-3 font-semibold text-slate-800">{item.product?.title}</td>
                                    <td className="p-3 font-bold text-slate-900">{item.quantity} × {formatCurrency(item.unit_price)} ({formatCurrency(item.total_price)})</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                                        {item.merchant_status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl">
                            No orders placed with this merchant yet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: Product Catalog */}
                    {detailTab === 'products' && (
                      <div className="space-y-4">
                        {loadingDetails ? (
                          <p className="p-8 text-center text-slate-400">Loading catalog items...</p>
                        ) : merchantProducts.length > 0 ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="p-3">Product</th>
                                  <th className="p-3">Price</th>
                                  <th className="p-3">Stock</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3">Search Priority</th>
                                  <th className="p-3">Added Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {merchantProducts.map((p) => {
                                  const img = p.images?.find((i: any) => i.is_primary)?.url || p.images?.[0]?.url;
                                  return (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                            {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-900">{p.title}</p>
                                            {p.title_te && <p className="text-[#FF6B00] text-[10px]">{p.title_te}</p>}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 font-bold text-slate-900">{formatCurrency(p.price)}</td>
                                      <td className="p-3 font-bold text-slate-700">{p.stock_quantity || 0}</td>
                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                          p.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {p.approval_status}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-[#FF6B00]">Priority {p.search_priority || 0}</td>
                                      <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl">
                            This merchant has not listed any products yet.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              {!actionModal.type && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    {selectedMerchant.verification_status === 'pending' && (
                      <>
                        <button 
                          onClick={() => setActionModal({ open: true, type: 'reject' })} 
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
                        >
                          Reject Application
                        </button>
                        <button 
                          onClick={() => setActionModal({ open: true, type: 'approve' })} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                        >
                          Grant Publishing Access
                        </button>
                      </>
                    )}
                    {selectedMerchant.verification_status === 'approved' && (
                      <button 
                        onClick={() => setActionModal({ open: true, type: 'suspend' })} 
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs transition-colors border border-amber-200"
                      >
                        Suspend Seller Account
                      </button>
                    )}
                    {selectedMerchant.verification_status === 'suspended' && (
                      <button 
                        onClick={() => setActionModal({ open: true, type: 'approve' })} 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                      >
                        Reactivate Merchant
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setSelectedMerchant(null)} 
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
