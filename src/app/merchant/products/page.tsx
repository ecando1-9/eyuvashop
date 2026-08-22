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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-4">Product Name (EN / TE)</th>
                    <th className="p-4">SKU & Weight</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price & History</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((product) => {
                    const primaryImg = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                    const displayWeight = product.parcel_weight_kg ? `${product.parcel_weight_kg} kg (Parcel)` : `${product.weight_kg || 0.5} kg`;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                              {primaryImg ? (
                                <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 line-clamp-1">{product.title}</span>
                              {product.title_te && (
                                <span className="text-xs text-[#FF6B00] font-medium block">{product.title_te}</span>
                              )}
                              {product.rejection_reason && (
                                <p className="text-xs text-red-600 font-medium">Reason: {product.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-500 text-xs font-mono block">{product.sku || '-'}</span>
                          <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                            {displayWeight}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-xs">{product.category?.name || 'Uncategorized'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                            <button
                              type="button"
                              onClick={() => setHistoryModal({ open: true, productId: product.id, title: product.title })}
                              className="p-1 text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 rounded-md transition-colors"
                              title="View Price History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            product.stock_quantity <= 0 ? 'bg-red-100 text-red-700' :
                            product.stock_quantity <= product.low_stock_threshold ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.stock_quantity} in stock
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            product.approval_status === 'approved' && product.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                            product.approval_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            product.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product.approval_status === 'approved' ? product.status : product.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
