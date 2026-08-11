"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Search, Eye, Filter, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const tabs = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled", "Refunded"];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

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
    if (user && user.role === "admin") fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || 
                          o.user?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "All") return matchesSearch;
    return matchesSearch && o.status.toLowerCase() === activeTab.toLowerCase();
  });

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (authLoading || (loading && orders.length === 0)) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Platform-wide order overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Orders</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Delivered</p>
          <p className="text-xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{orders.filter(o => o.status === 'cancelled').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-orange-50 border-orange-100">
          <p className="text-xs text-orange-600 uppercase">Revenue (Paid)</p>
          <p className="text-xl font-bold text-[#FF6B00]">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab ? "border-[#FF6B00] text-[#FF6B00]" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50">
             <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Order #</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      {order.user?.full_name}<br/>
                      <span className="text-xs text-gray-500">{order.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs uppercase bg-gray-100 text-gray-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {expandedRow === order.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </td>
                  </tr>
                  {expandedRow === order.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                            <div className="space-y-2">
                              {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center bg-white p-2 border rounded">
                                  <div>
                                    <p className="text-sm font-medium">{item.product?.title}</p>
                                    <p className="text-xs text-gray-500">Store: {item.store?.name} • Qty: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(item.unit_price * item.quantity)}</p>
                                    <span className="text-[10px] uppercase bg-gray-100 px-1 rounded">{item.merchant_status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                            <div className="bg-white p-3 border rounded text-sm text-gray-700">
                              {order.address_snapshot ? (
                                <>
                                  <p className="font-medium">{order.address_snapshot.full_name}</p>
                                  <p>{order.address_snapshot.address_line1}</p>
                                  <p>{order.address_snapshot.city}, {order.address_snapshot.state} {order.address_snapshot.postal_code}</p>
                                  <p>Phone: {order.address_snapshot.phone}</p>
                                </>
                              ) : "No address data"}
                            </div>
                            
                            <h4 className="font-semibold text-gray-900 mt-4 mb-2">Payment Details</h4>
                            <div className="bg-white p-3 border rounded text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{order.payment_method}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatCurrency(order.shipping_fee)}</span></div>
                              <div className="flex justify-between font-bold pt-2 border-t mt-2"><span className="text-gray-900">Total</span><span className="text-[#FF6B00]">{formatCurrency(order.total_amount)}</span></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
