"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PriceHistoryModal } from "@/components/merchant/PriceHistoryModal";
import { 
  Plus, Search, Edit, Trash2, Send, History, Loader2
} from "lucide-react";

export default function MerchantProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Price history modal state
  const [historyModal, setHistoryModal] = useState<{ open: boolean; productId: string; title: string }>({
    open: false, productId: '', title: ''
  });
  
  const [stats, setStats] = useState({
    total: 0, published: 0, pending: 0, rejected: 0, draft: 0
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: mProfile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!mProfile) {
        setLoading(false);
        return;
      }
      
      const { data: storeData } = await supabase.from('stores').select('id').eq('merchant_id', mProfile.id).maybeSingle();
      if (!storeData) {
        setLoading(false);
        return;
      }
      setStore(storeData);

      const { data, error } = await supabase.from('products')
        .select(`
          id, title, title_te, sku, price, compare_at_price, weight_kg, parcel_weight_kg, status, approval_status, rejection_reason, stock_quantity, low_stock_threshold, created_at,
          images:product_images(url, is_primary),
          category:categories(name)
        `)
        .eq('store_id', storeData.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allProducts = data || [];
      setProducts(allProducts);

      setStats({
        total: allProducts.length,
        published: allProducts.filter(p => p.status === 'published' && p.approval_status === 'approved').length,
        pending: allProducts.filter(p => p.approval_status === 'pending').length,
        rejected: allProducts.filter(p => p.approval_status === 'rejected').length,
        draft: allProducts.filter(p => p.status === 'draft').length
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const handleAction = async (id: string, action: 'submit' | 'archive' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm("Are you sure you want to delete this product?")) return;
        await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      } else if (action === 'submit') {
        await supabase.from('products').update({ approval_status: 'pending', submitted_at: new Date().toISOString() }).eq('id', id);
      } else if (action === 'archive') {
        await supabase.from('products').update({ status: 'archived' }).eq('id', id);
      }
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterStatus === 'published' && (p.status !== 'published' || p.approval_status !== 'approved')) return false;
    if (filterStatus === 'pending' && p.approval_status !== 'pending') return false;
    if (filterStatus === 'rejected' && p.approval_status !== 'rejected') return false;
    if (filterStatus === 'draft' && p.status !== 'draft') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || 
             (p.title_te && p.title_te.toLowerCase().includes(q)) || 
             (p.sku && p.sku.toLowerCase().includes(q));
    }
    return true;
  });

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" /></div>;
  }

  return (
    <MerchantLayout title="Product Management" subtitle="Create, edit, and track approval status of your store products">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Total SKUs</span>
            <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Published</span>
            <p className="text-2xl font-extrabold text-emerald-600">{stats.published}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Pending</span>
            <p className="text-2xl font-extrabold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Rejected</span>
            <p className="text-2xl font-extrabold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Drafts</span>
            <p className="text-2xl font-extrabold text-gray-600">{stats.draft}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'published', 'pending', 'rejected', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filterStatus === status 
                    ? 'bg-[#FF6B00] text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by English or Telugu title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
            
            <Link
              href="/merchant/products/new"
              className="bg-[#FF6B00] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#e05e00] transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="font-medium text-sm">Loading catalog...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-4 whitespace-nowrap">Product Details</th>
                    <th className="px-5 py-4 whitespace-nowrap">Inventory</th>
                    <th className="px-5 py-4 whitespace-nowrap">Pricing</th>
                    <th className="px-5 py-4 whitespace-nowrap">Status</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((product) => {
                    const primaryImg = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                    const displayWeight = product.parcel_weight_kg ? `${product.parcel_weight_kg} kg (Parcel)` : `${product.weight_kg || 0.5} kg`;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200/60 overflow-hidden flex-shrink-0 shadow-sm relative">
                              {primaryImg ? (
                                <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-medium bg-gray-50">No img</div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#FF6B00] transition-colors">{product.title}</span>
                              {product.title_te && (
                                <span className="text-[11px] text-[#FF6B00] font-semibold block">{product.title_te}</span>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200/60">
                                  {product.sku || 'NO-SKU'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {product.category?.name || 'Uncategorized'}
                                </span>
                              </div>
                              {product.rejection_reason && (
                                <p className="text-[11px] text-red-600 font-semibold bg-red-50 p-1.5 rounded-md inline-block mt-1">
                                  Reason: {product.rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                              product.stock_quantity <= 0 ? 'bg-red-50 text-red-700 border-red-200' :
                              product.stock_quantity <= product.low_stock_threshold ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {product.stock_quantity} in stock
                            </span>
                            <span className="block text-[11px] text-gray-500 font-medium ml-1">
                              W: {displayWeight}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-gray-900">{formatCurrency(product.price)}</span>
                              {product.compare_at_price > product.price && (
                                <span className="text-[11px] text-gray-400 line-through font-medium">
                                  {formatCurrency(product.compare_at_price)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setHistoryModal({ open: true, productId: product.id, title: product.title })}
                              className="p-1.5 text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                              title="View Price History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex items-center justify-center text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                              product.approval_status === 'approved' && product.status === 'published' ? 'bg-emerald-500 text-white border-emerald-600' :
                              product.approval_status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              product.approval_status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {product.approval_status === 'approved' ? product.status : product.approval_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Submit for approval — only show for draft products */}
                            {product.status === 'draft' && product.approval_status !== 'pending' && (
                              <button 
                                onClick={() => handleAction(product.id, 'submit')}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" 
                                title="Submit for Approval"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit product */}
                            <Link
                              href={`/merchant/products/${product.id}/edit`}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            
                            <button 
                              onClick={() => handleAction(product.id, 'delete')}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12">
              <EmptyState 
                title="No products found" 
                description={searchQuery ? `No products match "${searchQuery}"` : "You haven't added any products yet."}
                actionLabel={searchQuery ? "Clear Search" : "Add Product"}
                actionHref={searchQuery ? "/merchant/products" : "/merchant/products/new"}
              />
            </div>
          )}
        </div>
      </div>

      <PriceHistoryModal
        productId={historyModal.productId}
        productTitle={historyModal.title}
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, productId: '', title: '' })}
      />
    </MerchantLayout>
  );
}
