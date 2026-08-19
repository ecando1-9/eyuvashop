"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { 
  Search, CheckCircle, XCircle, Eye, AlertCircle, Package, Archive,
  X, Image as ImageIcon, Store, Tag, Filter, Check, Flame, Award, Sparkles, Save
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminProductsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending Approval");
  const [search, setSearch] = useState("");
  
  // Inspection & Ranking Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchPriorityInput, setSearchPriorityInput] = useState<number>(0);
  const [trendingPriorityInput, setTrendingPriorityInput] = useState<number>(0);
  const [isTrendingToggle, setIsTrendingToggle] = useState(false);
  const [isFeaturedToggle, setIsFeaturedToggle] = useState(false);
  const [savingRankings, setSavingRankings] = useState(false);

  // Rejection modal
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = ["All", "Pending Approval", "Published", "Trending & Featured", "Rejected", "Draft", "Archived"];
  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products')
        .select(`
          *,
          images:product_images(url, is_primary, display_order),
          store:stores(name, slug, logo_url, priority),
          category:categories(name)
        `)
        .is('deleted_at', null)
        .order('search_priority', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Primary product fetch fallback:", error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        setProducts(fallbackData || []);
      } else {
        setProducts(data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const handleOpenProduct = (p: any) => {
    setSelectedProduct(p);
    setSearchPriorityInput(p.search_priority || 0);
    setTrendingPriorityInput(p.trending_priority || 0);
    setIsTrendingToggle(!!p.is_trending);
    setIsFeaturedToggle(!!p.is_featured);
  };

  const handleSaveRankings = async () => {
    if (!selectedProduct) return;
    try {
      setSavingRankings(true);
      const payload = {
        search_priority: Number(searchPriorityInput) || 0,
        trending_priority: Number(trendingPriorityInput) || 0,
        is_trending: isTrendingToggle,
        is_featured: isFeaturedToggle,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setSelectedProduct({ ...selectedProduct, ...payload });
      await fetchProducts();
      alert("Product priority & homepage trending settings updated!");
    } catch (err: any) {
      alert("Error saving rankings: " + err.message);
    } finally {
      setSavingRankings(false);
    }
  };

  const handleUpdateStatus = async (productId: string, approvalStatus: string, reason: string | null = null) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('admin_update_product_status', {
        p_admin_id: user?.id,
        p_product_id: productId,
        p_approval_status: approvalStatus,
        p_rejection_reason: reason
      });

      if (error) throw error;
      
      await fetchProducts();
      setSelectedProduct(null);
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (activeTab === "Pending Approval" && product.approval_status !== "pending") return false;
    if (activeTab === "Published" && (product.status !== "published" || product.approval_status !== "approved")) return false;
    if (activeTab === "Trending & Featured" && !product.is_trending && !product.is_featured) return false;
    if (activeTab === "Rejected" && product.approval_status !== "rejected") return false;
    if (activeTab === "Draft" && product.status !== "draft") return false;
    if (activeTab === "Archived" && product.status !== "archived") return false;

    if (search) {
      const q = search.toLowerCase();
      const matchTitle = product.title?.toLowerCase().includes(q);
      const matchTelugu = product.title_te?.toLowerCase().includes(q);
      const matchSku = product.sku?.toLowerCase().includes(q);
      const matchStore = product.store?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchTelugu && !matchSku && !matchStore) return false;
    }

    return true;
  });

  const pendingCount = products.filter(p => p.approval_status === "pending").length;

  if (authLoading) return null;

  return (
    <AdminLayout title="Product Approvals & Search Priority Ranking" subtitle="Approve seller products, manage search ranking priority, and curate homepage trending sections">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tabs & Search */}
          <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab
                      ? "bg-[#FF6B00] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab}</span>
                  {tab === "Pending Approval" && pendingCount > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      activeTab === tab ? "bg-white text-[#FF6B00]" : "bg-[#FF6B00] text-white"
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, SKU, store..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Product Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Merchant Store</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Search Priority</th>
                  <th className="p-4">Homepage Badges</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading catalog items...</td></tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const primaryImg = p.images?.find((img: any) => img.is_primary)?.url || p.images?.[0]?.url;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {primaryImg ? (
                                <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No img</div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                              {p.title_te && <p className="text-[#FF6B00] text-[11px] font-medium">{p.title_te}</p>}
                              <p className="text-slate-400 text-[10px] font-mono">SKU: {p.sku || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-700">{p.store?.name || '-'}</p>
                          {p.store?.priority ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">Store Priority {p.store.priority}</span>
                          ) : null}
                        </td>
                        <td className="p-4 font-black text-slate-900">{formatCurrency(p.price)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black inline-flex items-center gap-1 ${
                            (p.search_priority || 0) > 0 ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Award className="w-3 h-3" /> Priority {p.search_priority || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {p.is_trending && (
                              <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Trending ({p.trending_priority || 0})
                              </span>
                            )}
                            {p.is_featured && (
                              <span className="bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Featured
                              </span>
                            )}
                            {!p.is_trending && !p.is_featured && <span className="text-slate-400 text-xs">-</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.approval_status === 'approved' && p.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                            p.approval_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            p.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'approved')}
                                  disabled={actionLoading}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                  title="Approve & Publish"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={actionLoading}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                  title="Reject Product"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenProduct(p)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                              title="Inspect & Rank"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect / Rank
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No products found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Inspection & Ranking Modal */}
        {selectedProduct && !showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-slate-900 text-sm">Product Inspection & Search Priority Control</h3>
                <button onClick={() => setSelectedProduct(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                <div>
                  <h4 className="text-base font-black text-slate-900">{selectedProduct.title}</h4>
                  {selectedProduct.title_te && <p className="text-sm font-bold text-[#FF6B00]">{selectedProduct.title_te}</p>}
                </div>

                {/* Priority & Trending Admin Configuration */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#FF6B00]" />
                      <h5 className="font-extrabold text-xs text-slate-900">Search Ranking & Homepage Priority</h5>
                    </div>
                    <button
                      onClick={handleSaveRankings}
                      disabled={savingRankings}
                      className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingRankings ? 'Saving...' : 'Save Rankings'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Search Priority (0 - 999)
                      </label>
                      <p className="text-[10px] text-slate-500 mb-1.5">Higher priority appears first when users search for this or competing products.</p>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={searchPriorityInput}
                        onChange={(e) => setSearchPriorityInput(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Trending Display Priority (0 - 999)
                      </label>
                      <p className="text-[10px] text-slate-500 mb-1.5">Sort order in the Homepage Trending Carousel.</p>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={trendingPriorityInput}
                        onChange={(e) => setTrendingPriorityInput(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTrendingToggle}
                        onChange={(e) => setIsTrendingToggle(e.target.checked)}
                        className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                      <span className="font-bold text-slate-800 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-red-500" /> Show in Trending Section</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeaturedToggle}
                        onChange={(e) => setIsFeaturedToggle(e.target.checked)}
                        className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                      <span className="font-bold text-slate-800 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Show in Featured Section</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block font-semibold">Selling Price</span>
                    <span className="font-black text-slate-900 text-sm">{formatCurrency(selectedProduct.price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Store</span>
                    <span className="font-bold text-slate-900">{selectedProduct.store?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Weight</span>
                    <span className="font-bold text-slate-900">{selectedProduct.weight_kg ? `${selectedProduct.weight_kg} kg` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Stock Quantity</span>
                    <span className="font-bold text-slate-900">{selectedProduct.stock_quantity || 0} units</span>
                  </div>
                </div>

                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div>
                    <span className="text-slate-400 block font-semibold mb-2">Attached Images</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedProduct.images.map((img: any, idx: number) => (
                        <div key={idx} className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                {selectedProduct.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedProduct.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                    >
                      Approve Product
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-slate-200">
              <h3 className="font-black text-slate-900 text-sm">Reason for Product Rejection</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain to merchant what needs improvement..."
                rows={4}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedProduct.id, 'rejected', rejectionReason)}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
