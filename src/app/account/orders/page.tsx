'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Eye, RotateCcw, X, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SkeletonOrderCard } from '@/components/account/SkeletonLoader';
import { EmptyState } from '@/components/account/EmptyState';

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  created_at: string;
  item_count: number;
}

const tabs: { label: string; value: OrderStatus }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  shipped: { label: 'Shipped', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  refunded: { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'Unpaid', color: 'text-red-600' },
  paid: { label: 'Paid', color: 'text-green-600' },
  refunded: { label: 'Refunded', color: 'text-gray-600' },
  failed: { label: 'Payment Failed', color: 'text-red-600' },
};

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    setPage(1);
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user, activeTab, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`id, order_number, status, payment_status, total_amount, subtotal, shipping_fee, discount, created_at, order_items(id)`, { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, count, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setOrders((data || []).map((o: any) => ({ ...o, item_count: o.order_items?.length || 0 })));
      setTotalCount(count || 0);
    } catch {
      setError('Unable to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const canCancel = (status: string) => ['pending', 'processing'].includes(status);
  const canReturn = (status: string) => ['delivered'].includes(status);
  const canTrack = (status: string) => ['shipped', 'delivered'].includes(status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalCount} total order{totalCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-4 py-3.5 text-xs font-bold transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.value
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(4)].map((_, i) => <SkeletonOrderCard key={i} />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 font-semibold text-sm">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-3 text-[#FF6B00] text-sm font-bold hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders found"
              description={activeTab === 'all' ? 'You haven\'t placed any orders yet. Start shopping!' : `No ${activeTab} orders found.`}
              actionLabel="Start Shopping"
              actionHref="/"
            />
          ) : (
            orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const payConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
              return (
                <div key={order.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-extrabold text-gray-900">#{order.order_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.item_count} item{order.item_count !== 1 ? 's' : ''} · Placed{' '}
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs font-semibold ${payConfig.color}`}>
                        {payConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-xl text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
                      {order.discount > 0 && (
                        <p className="text-xs text-green-600 font-semibold">You saved ₹{order.discount.toLocaleString('en-IN')}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center gap-1.5 bg-gray-900 hover:bg-[#FF6B00] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Link>
                      {canTrack(order.status) && (
                        <Link
                          href={`/account/orders/${order.id}#timeline`}
                          className="flex items-center gap-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" /> Track
                        </Link>
                      )}
                      {canReturn(order.status) && (
                        <Link
                          href={`/account/returns?order=${order.id}`}
                          className="flex items-center gap-1.5 border border-orange-200 text-[#FF6B00] hover:bg-orange-50 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Return
                        </Link>
                      )}
                      {canCancel(order.status) && (
                        <Link
                          href={`/account/orders/${order.id}?action=cancel`}
                          className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {totalCount} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
