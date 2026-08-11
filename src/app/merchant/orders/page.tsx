"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  Package, 
  Search, 
  Loader2,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  Truck,
  Box
} from "lucide-react";

export default function MerchantOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadOrders = async () => {
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
      
      const { data: items, error } = await supabase
        .from("order_items")
        .select(`
          id, quantity, unit_price, total_price, merchant_status, created_at,
          product:products(id, title, images:product_images(url, is_primary)),
          order:orders(id, order_number, status, payment_status, created_at, address_snapshot)
        `)
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setOrderItems(items || []);
      
      // Group by order
      const groups: Record<string, any> = {};
      items?.forEach(item => {
        const orderInfo = Array.isArray(item.order) ? item.order[0] : item.order;
        const oId = orderInfo?.id;
        if (!oId) return;
        
        if (!groups[oId]) {
          groups[oId] = {
            order_id: oId,
            order_number: orderInfo.order_number,
            created_at: orderInfo.created_at,
            address: orderInfo.address_snapshot,
            payment_status: orderInfo.payment_status,
            items: [],
            total_amount: 0
          };
        }
        groups[oId].items.push(item);
        groups[oId].total_amount += Number(item.total_price);
      });
      
      setGroupedOrders(Object.values(groups).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("order_items")
        .update({ merchant_status: newStatus })
        .eq("id", itemId);
        
      if (error) throw error;
      
      // Update local state
      loadOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  // Filter groups
  const filteredGroups = groupedOrders.filter(group => {
    // Search by order number or customer name
    const searchMatch = !searchQuery || 
      group.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      group.address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!searchMatch) return false;
    
    // Status filter - if 'all' show all, else check if any item matches status
    if (filterStatus === 'all') return true;
    return group.items.some((i: any) => i.merchant_status === filterStatus);
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'packed': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextAction = (status: string, itemId: string) => {
    switch(status) {
      case 'pending': 
        return <button onClick={() => updateItemStatus(itemId, 'confirmed')} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Confirm Order</button>;
      case 'confirmed':
        return <button onClick={() => updateItemStatus(itemId, 'packed')} className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">Mark Packed</button>;
      case 'packed':
        return <button onClick={() => updateItemStatus(itemId, 'shipped')} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Mark Shipped</button>;
      case 'shipped':
        return <button onClick={() => updateItemStatus(itemId, 'delivered')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Mark Delivered</button>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Manage and fulfill your customer orders.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map(status => (
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
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            />
          </div>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <div key={group.order_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Order Number</p>
                    <p className="font-semibold text-gray-900">{group.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date Placed</p>
                    <p className="font-medium text-gray-700 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="font-semibold text-[#FF6B00]">{formatCurrency(group.total_amount)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="text-sm font-medium flex items-center justify-end">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {group.payment_status}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Order Items</h4>
                  {group.items.map((item: any) => {
                    const primaryImg = item.product?.images?.find((img: any) => img.is_primary)?.url || item.product?.images?.[0]?.url;
                    
                    // Skip if item doesn't match filter (unless 'all')
                    if (filterStatus !== 'all' && item.merchant_status !== filterStatus) return null;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                            {primaryImg ? (
                              <img src={primaryImg} alt={item.product?.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-8 h-8 text-gray-300 m-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.product?.title || 'Unknown Product'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${getStatusColor(item.merchant_status)}`}>
                                {item.merchant_status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                          {getNextAction(item.merchant_status, item.id)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center mb-3 border-b pb-2">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Customer Details
                  </h4>
                  {group.address ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">{group.address.full_name}</p>
                      <p className="text-xs truncate">{group.address.address_line1}</p>
                      {group.address.address_line2 && <p className="text-xs truncate">{group.address.address_line2}</p>}
                      <p className="text-xs">{group.address.city}, {group.address.state} {group.address.postal_code}</p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700">Delivery Instructions:</p>
                        <p className="text-xs text-gray-500 mt-1">Leave at front door.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Address not available</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <EmptyState 
            title="No orders found" 
            description={searchQuery ? `No orders match "${searchQuery}"` : "You don't have any orders yet. Orders will appear here when customers purchase your products."}
            icon="inbox"
          />
        </div>
      )}
    </div>
  );
}
