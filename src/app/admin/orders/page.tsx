"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Search, ChevronDown, ChevronUp, ShoppingBag, Loader2 } from "lucide-react";

export default function AdminOrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const tabs = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled", "Refunded"];

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('orders')
        .select(`
          id, order_number, status, payment_status, total_amount, subtotal, shipping_fee, discount, created_at, payment_method, address_snapshot,
          user:users(full_name, email),
          order_items(id, quantity, unit_price, merchant_status, product:products(title), store:stores(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrders();
    }
  }, [user, isAdmin]);

  const filteredOrders = orders.filter(order => {
    if (activeTab !== "All" && order.status.toLowerCase() !== activeTab.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = order.order_number?.toLowerCase().includes(q);
      const matchName = order.user?.full_name?.toLowerCase().includes(q);
      const matchEmail = order.user?.email?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (authLoading) return null;

  return (
    <AdminLayout title="Orders & Platform Shipments" subtitle="Track real-time transactions, payment statuses, and merchant fulfillment across all stores">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-xl font-black text-slate-900 mt-1">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-black text-amber-600 mt-1">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cancelled</p>
            <p className="text-xl font-black text-red-600 mt-1">{orders.filter(o => o.status === 'cancelled').length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/40">
            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Paid Revenue</p>
            <p className="text-xl font-black text-[#FF6B00] mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Orders Table Container */}
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
                placeholder="Search order # or buyer..."
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
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading orders...</td></tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#{order.order_number}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{order.user?.full_name || 'Guest'}</p>
                          <p className="text-[11px] text-slate-400">{order.user?.email}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900">{formatCurrency(order.total_amount)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          >
                            <span>{expandedRow === order.id ? 'Hide' : 'View'}</span>
                            {expandedRow === order.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === order.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-200">
                              <div>
                                <h4 className="font-bold text-slate-900 mb-2">Purchased Items</h4>
                                <div className="space-y-2">
                                  {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                                      <div>
                                        <p className="font-bold text-slate-900">{item.product?.title}</p>
                                        <p className="text-[11px] text-slate-400">Store: {item.store?.name || 'eYuvaStore'}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-slate-900">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.merchant_status}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 mb-2">Delivery Address</h4>
                                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-0.5 text-slate-600">
                                  <p className="font-bold text-slate-900">{order.address_snapshot?.full_name}</p>
                                  <p>{order.address_snapshot?.address_line1}</p>
                                  <p>{order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.postal_code}</p>
                                  <p className="font-mono pt-1 text-slate-500">{order.address_snapshot?.phone}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No orders found matching criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
