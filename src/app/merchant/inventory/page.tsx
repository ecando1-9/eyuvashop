"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  Package, 
  Search, 
  Loader2,
  AlertTriangle,
  Edit2,
  Check,
  X
} from "lucide-react";

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
  const [editValue, setEditValue] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: profile } = await supabase
        .from("merchant_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (!profile) return;
      
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("merchant_id", profile.id)
        .single();
        
      if (!storeData) {
        setLoading(false);
        return;
      }
      
      setStore(storeData);
      
      const { data: prods, error } = await supabase
        .from("products")
        .select(`
          id, title, sku, stock_quantity, low_stock_threshold, status, approval_status,
          images:product_images(url, is_primary)
        `)
        .eq("store_id", storeData.id)
        .is("deleted_at", null)
        .order("stock_quantity", { ascending: true });
        
      if (error) throw error;
      
      setProducts(prods || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const startEditing = (product: any) => {
    setEditingId(product.id);
    setEditValue(product.stock_quantity);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveStock = async (productId: string) => {
    if (editValue < 0) return;
    
    setSavingId(productId);
    try {
      // Update product table
      const { error: pError } = await supabase
        .from("products")
        .update({ stock_quantity: editValue })
        .eq("id", productId);
        
      if (pError) throw pError;
      
      // Update inventory table
      const { error: iError } = await supabase
        .from("inventory")
        .update({ quantity: editValue })
        .eq("product_id", productId);
        
      if (iError) console.warn("Failed to sync inventory table, but product updated", iError);
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock_quantity: editValue } : p
      ));
      
      setEditingId(null);
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Failed to update stock");
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock_quantity > p.low_stock_threshold).length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    if (filterStatus === 'low') return p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
    if (filterStatus === 'out') return p.stock_quantity === 0;
    
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Monitor and update your product stock levels.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total SKUs</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">{stats.inStock}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-semibold mt-1 text-orange-500">{stats.lowStock}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'low', label: 'Low Stock' },
              { id: 'out', label: 'Out of Stock' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === tab.id 
                    ? 'bg-[#FF6B00] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Available Stock</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => {
                  const primaryImg = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                  const isOut = product.stock_quantity === 0;
                  const isLow = !isOut && product.stock_quantity <= product.low_stock_threshold;
                  const isEditing = editingId === product.id;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {primaryImg ? (
                              <img src={primaryImg} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-[#FF6B00] rounded focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                              autoFocus
                            />
                            <button 
                              onClick={() => saveStock(product.id)}
                              disabled={savingId === product.id}
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                            >
                              {savingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => startEditing(product)}>
                            <span className={`text-sm font-medium ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                              {product.stock_quantity}
                            </span>
                            <Edit2 className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-[#FF6B00] transition-all" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.low_stock_threshold}
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
  );
}
