"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Archive, 
  Send,
  AlertTriangle,
  Loader2,
  MoreVertical,
  Filter
} from "lucide-react";

export default function MerchantProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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
          *,
          images:product_images(url, is_primary),
          category:categories(name)
        `)
        .eq("store_id", storeData.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setProducts(prods || []);
      
      // Compute stats
      const newStats = { total: prods?.length || 0, published: 0, pending: 0, rejected: 0, draft: 0 };
      prods?.forEach(p => {
        if (p.approval_status === 'approved') newStats.published++;
        else if (p.approval_status === 'pending') newStats.pending++;
        else if (p.approval_status === 'rejected') newStats.rejected++;
        else newStats.draft++; // fallback
      });
      setStats(newStats);
      
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleAction = async (productId: string, action: 'submit' | 'archive' | 'delete') => {
    if (action === 'delete' && !confirm("Are you sure you want to delete this product?")) return;
    
    try {
      let updateData = {};
      if (action === 'submit') {
        updateData = { approval_status: 'pending', submitted_at: new Date().toISOString() };
      } else if (action === 'archive') {
        updateData = { status: 'archived' };
      } else if (action === 'delete') {
        updateData = { deleted_at: new Date().toISOString() };
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
      
      // Reload
      loadData();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} product`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6">
        <EmptyState 
          title="Store Not Setup" 
          description="You need to set up your store profile before adding products."
          actionLabel="Setup Store"
          actionHref="/merchant/store"
        />
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    if (filterStatus === 'archived') return p.status === 'archived';
    
    return p.approval_status === filterStatus;
  });

  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (status === 'archived') return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">Archived</span>;
    
    switch (approvalStatus) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Published</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Rejected</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Draft</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your store's product catalog.</p>
        </div>
        <Link 
          href="/merchant/products/new"
          className="flex items-center space-x-2 bg-[#FF6B00] hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
          { label: 'Drafts', value: stats.draft, color: 'text-gray-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto">
            {['all', 'approved', 'pending', 'draft', 'rejected', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-[#FF6B00] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => {
                  const primaryImg = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {primaryImg ? (
                              <img src={primaryImg} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-gray-400 text-xs">No img</div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                          </div>
                        </div>
                        {product.approval_status === 'rejected' && product.rejection_reason && (
                          <div className="mt-2 text-xs text-red-600 flex items-start">
                            <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                            <span>{product.rejection_reason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className={isLowStock ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {product.stock_quantity}
                          </span>
                          {isLowStock && <AlertTriangle className="w-4 h-4 ml-1 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status, product.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-gray-400 hover:text-[#FF6B00]" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {(product.approval_status === 'draft' || product.approval_status === 'rejected') && (
                            <button 
                              onClick={() => handleAction(product.id, 'submit')}
                              className="text-gray-400 hover:text-green-600" 
                              title="Submit for Approval"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          
                          {product.status !== 'archived' && (
                            <button 
                              onClick={() => handleAction(product.id, 'archive')}
                              className="text-gray-400 hover:text-orange-600" 
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleAction(product.id, 'delete')}
                            className="text-gray-400 hover:text-red-600" 
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
  );
}
