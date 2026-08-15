"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { Search, Loader2 } from "lucide-react";

export default function MerchantOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
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
      const { data: mProfile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).single();
      if (!mProfile) return;
      
      const { data: storeData } = await supabase.from('stores').select('id').eq('merchant_id', mProfile.id).single();
      if (!storeData) return;

      const { data, error } = await supabase.from('order_items')
        .select(`
          id, quantity, unit_price, total_price, merchant_status, created_at,
          product:products(id, title, images:product_images(url, is_primary)),
          order:orders(id, order_number, status, payment_status, created_at, address_snapshot)
        `)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped: { [key: string]: any } = {};
      (data || []).forEach((item: any) => {
        const orderObj = Array.isArray(item.order) ? item.order[0] : item.order;
        if (!orderObj || !orderObj.id) return;
        const orderId = orderObj.id;
        if (!grouped[orderId]) {
          grouped[orderId] = {
            order: orderObj,
            items: [],
            totalAmount: 0,
            merchantStatus: item.merchant_status || 'pending',
            createdAt: item.created_at
          };
        }
        grouped[orderId].items.push(item);
        grouped[orderId].totalAmount += item.total_price;
      });

      setGroupedOrders(Object.values(grouped));

    } catch (err) {
      console.error(err);
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
        .from('order_items')
        .update({ merchant_status: newStatus })
        .eq('id', itemId);

      if (error) throw error;
      loadOrders();
    } catch (err: any) {
      alert("Error updating order status: " + err.message);
    }
  };

  const filteredOrders = groupedOrders.filter(group => {
    if (filterStatus !== 'all') {
      const hasStatus = group.items.some((item: any) => item.merchant_status === filterStatus);
      if (!hasStatus) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const orderNum = group.order.order_number?.toLowerCase() || '';
      const addressName = group.order.address_snapshot?.full_name?.toLowerCase() || '';
      return orderNum.includes(q) || addressName.includes(q);
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase">Delivered</span>;
      case 'shipped': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">Shipped</span>;
      case 'packed': return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase">Packed</span>;
      case 'confirmed': return <span className="px-2.5 py-1 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full text-xs font-bold uppercase">Confirmed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase">Cancelled</span>;
      default: return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">Pending</span>;
    }
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" /></div>;
  }

  return (
    <MerchantLayout title="Order Management" subtitle="Manage and process incoming customer orders for your store">
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((status) => (
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

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 text-sm border border-gray-200">Loading orders...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((group) => (
              <div key={group.order.id} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm">Order #{group.order.order_number}</span>
                      {getStatusBadge(group.merchantStatus)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Placed on {new Date(group.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Total Revenue</span>
                    <span className="text-base font-extrabold text-gray-900">{formatCurrency(group.totalAmount)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {group.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0]?.url ? (
                            <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.product?.title || 'Product'}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.merchant_status === 'pending' && (
                          <button
                            onClick={() => updateItemStatus(item.id, 'confirmed')}
                            className="bg-[#FF6B00] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#e05e00]"
                          >
                            Confirm Order
                          </button>
                        )}
                        {item.merchant_status === 'confirmed' && (
                          <button
                            onClick={() => updateItemStatus(item.id, 'packed')}
                            className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-700"
                          >
                            Mark Packed
                          </button>
                        )}
                        {item.merchant_status === 'packed' && (
                          <button
                            onClick={() => updateItemStatus(item.id, 'shipped')}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {item.merchant_status === 'shipped' && (
                          <button
                            onClick={() => updateItemStatus(item.id, 'delivered')}
                            className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12">
            <EmptyState 
              title="No orders found" 
              description={searchQuery ? `No orders match "${searchQuery}"` : "You don't have any orders yet. Orders will appear here when customers purchase your products."}
              icon="inbox"
            />
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
