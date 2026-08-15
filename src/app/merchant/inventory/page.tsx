"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { Search, Loader2, Edit2, Check, X } from "lucide-react";

export default function MerchantInventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: mProfile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).single();
      if (!mProfile) return;
      
      const { data: storeData } = await supabase.from('stores').select('id').eq('merchant_id', mProfile.id).single();
      if (!storeData) return;
      setStore(storeData);

      const { data, error } = await supabase.from('products')
        .select('id, title, sku, stock_quantity, low_stock_threshold, status, approval_status, images:product_images(url, is_primary)')
        .eq('store_id', storeData.id)
        .is('deleted_at', null)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setProducts(data || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleStartEdit = (product: any) => {
    setEditingId(product.id);
    setEditStock(product.stock_quantity);
  };

  const handleSaveStock = async (productId: string) => {
    if (editStock < 0) {
      alert("Stock quantity cannot be negative.");
      return;
    }

    try {
      setSaveLoading(true);
      const { error: prodErr } = await supabase
        .from('products')
        .update({ stock_quantity: editStock })
        .eq('id', productId);

      if (prodErr) throw prodErr;

      await supabase
        .from('inventory')
        .upsert({ product_id: productId, quantity: editStock }, { onConflict: 'product_id' });

      setEditingId(null);
      loadData();
    } catch (err: any) {
      alert("Error updating stock: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const stats = {
    totalSkus: products.length,
    inStock: products.filter(p => p.stock_quantity > p.low_stock_threshold).length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length,
    outOfStock: products.filter(p => p.stock_quantity <= 0).length,
  };

  const filteredProducts = products.filter(p => {
    if (filterStatus === 'low' && !(p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)) return false;
    if (filterStatus === 'out' && p.stock_quantity > 0) return false;
    if (filterStatus === 'in' && p.stock_quantity <= p.low_stock_threshold) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" /></div>;
  }

  return (
    <MerchantLayout title="Inventory & Stock Management" subtitle="Monitor stock levels, set low stock thresholds, and update inventory in real-time">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Total SKUs</span>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalSkus}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">In Stock</span>
            <p className="text-2xl font-extrabold text-emerald-600">{stats.inStock}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Low Stock</span>
            <p className="text-2xl font-extrabold text-amber-600">{stats.lowStock}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Out of Stock</span>
            <p className="text-2xl font-extrabold text-red-600">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filter & Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'low', label: `Low Stock (${stats.lowStock})` },
              { id: 'out', label: `Out of Stock (${stats.outOfStock})` },
              { id: 'in', label: 'Healthy Stock' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === tab.id 
                    ? 'bg-[#FF6B00] text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading inventory...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-4">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Stock Condition</th>
                    <th className="p-4">Threshold</th>
                    <th className="p-4 text-right">Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((product) => {
                    const primaryImg = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                    const isEditing = editingId === product.id;
                    const isOut = product.stock_quantity <= 0;
                    const isLow = !isOut && product.stock_quantity <= product.low_stock_threshold;

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
                            <span className="font-bold text-gray-900 line-clamp-1">{product.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 text-xs font-mono">{product.sku || '-'}</td>
                        <td className="p-4 font-extrabold text-gray-900">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editStock}
                              onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-[#FF6B00] rounded-md focus:outline-none"
                            />
                          ) : (
                            <span>{product.stock_quantity} units</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isOut ? (
                            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase">Out of Stock</span>
                          ) : isLow ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">Low Stock Warning</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase">Healthy</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 text-xs font-medium">{product.low_stock_threshold} units</td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSaveStock(product.id)}
                                disabled={saveLoading}
                                className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="p-1.5 text-gray-500 hover:text-[#FF6B00] hover:bg-orange-50 rounded-md transition-colors"
                              title="Edit Stock"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
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
                description={searchQuery ? `No products match "${searchQuery}"` : "You haven't added any products to manage inventory."}
                actionLabel={searchQuery ? "Clear Search" : "Add Product"}
                actionHref={searchQuery ? "/merchant/inventory" : "/merchant/products/new"}
              />
            </div>
          )}
        </div>
      </div>
    </MerchantLayout>
  );
}
