"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { 
  Search, Filter, CheckCircle, XCircle, Eye, AlertCircle, Package, Archive,
  X, Image as ImageIcon, Store, Tag
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminProductsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending Approval");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const tabs = ["All", "Pending Approval", "Published", "Rejected", "Draft", "Archived"];

  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data, error } = await supabase.from('products')
        .select(`
          id, title, slug, price, compare_at_price, status, approval_status, rejection_reason, submitted_at, created_at, brand, sku, description, stock_quantity,
          images:product_images(url, is_primary, display_order),
          store:stores(name, slug, logo_url),
          category:categories(name)
        `)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const handleUpdateStatus = async (productId: string, status: string, reason: string = "") => {
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('admin_update_product_status', {
        p_admin_id: user?.id,
        p_product_id: productId,
        p_approval_status: status,
        p_rejection_reason: reason
      });

      if (error) throw error;

      await fetchProducts();
      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, approval_status: status, rejection_reason: reason });
      }
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err: any) {
      alert("Error updating product status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = products.filter(p => p.approval_status === "pending").length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Pending Approval") return matchesSearch && p.approval_status === "pending";
    if (activeTab === "Published") return matchesSearch && p.approval_status === "approved" && p.status === "active";
    if (activeTab === "Rejected") return matchesSearch && p.approval_status === "rejected";
    if (activeTab === "Draft") return matchesSearch && p.status === "draft";
    if (activeTab === "Archived") return matchesSearch && p.status === "archived";
    
    return matchesSearch;
  });

  if (authLoading || (loading && products.length === 0)) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchProducts} className="bg-[#FF6B00] text-white px-4 py-2 rounded-md">Try Again</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage merchant products</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs & Search */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 flex items-center ${
                  activeTab === tab
                    ? "border-[#FF6B00] text-[#FF6B00]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "Pending Approval" && pendingCount > 0 && (
                  <span className="ml-2 bg-[#FF6B00] text-white text-xs py-0.5 px-2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by title or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              />
            </div>
            <button className="flex items-center text-gray-600 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Store</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const primaryImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                            {primaryImage ? (
                              <img src={primaryImage} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1" title={product.title}>{product.title}</p>
                            <p className="text-xs text-gray-500 mt-1">SKU: {product.sku || 'N/A'} • {product.brand || 'No brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{product.store?.name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{product.category?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        {product.approval_status === "pending" && <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>}
                        {product.approval_status === "approved" && <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-medium">Approved</span>}
                        {product.approval_status === "rejected" && <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-medium">Rejected</span>}
                        {product.status === "archived" && <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium ml-1">Archived</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(product.submitted_at || product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.approval_status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(product.id, 'approved')}
                                disabled={actionLoading}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowRejectModal(true);
                                }}
                                disabled={actionLoading}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p>No products found for this filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Product Details</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Images */}
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img 
                        src={selectedProduct.images.find((i: any) => i.is_primary)?.url || selectedProduct.images[0].url} 
                        alt={selectedProduct.title} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedProduct.images.map((img: any, idx: number) => (
                        <div key={idx} className="h-16 w-16 bg-gray-100 rounded border border-gray-200 flex-shrink-0">
                          <img src={img.url} className="w-full h-full object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedProduct.approval_status === "pending" && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Pending Approval</span>}
                      {selectedProduct.approval_status === "approved" && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Approved</span>}
                      {selectedProduct.approval_status === "rejected" && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Rejected</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Store className="h-4 w-4" /> {selectedProduct.store?.name}</span>
                      <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {selectedProduct.category?.name}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Price:</span>
                      <span className="font-bold text-[#FF6B00] text-lg">{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    {selectedProduct.compare_at_price > selectedProduct.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Compare At:</span>
                        <span className="text-gray-500 line-through">{formatCurrency(selectedProduct.compare_at_price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">SKU:</span>
                      <span className="text-gray-900 font-medium">{selectedProduct.sku || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Brand:</span>
                      <span className="text-gray-900 font-medium">{selectedProduct.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Stock:</span>
                      <span className="text-gray-900 font-medium">{selectedProduct.stock_quantity || 0} units</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedProduct.description || 'No description provided.'}
                    </p>
                  </div>

                  {selectedProduct.approval_status === 'rejected' && selectedProduct.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Rejection Reason</h4>
                      <p className="text-sm">{selectedProduct.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Close
              </button>
              
              {selectedProduct.approval_status === 'pending' && (
                <>
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-md font-medium"
                  >
                    Reject Product
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedProduct.id, 'approved')}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center gap-2"
                  >
                    {actionLoading ? 'Processing...' : <><CheckCircle className="h-4 w-4" /> Approve Product</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Reject Product</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting <span className="font-semibold">{selectedProduct?.title}</span>. This will be visible to the merchant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Images are poor quality, description is misleading..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none"
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedProduct?.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
