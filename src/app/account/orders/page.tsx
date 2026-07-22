import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packed: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(id, title, image, price, quantity)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">My Orders</h1>
        <span className="text-sm text-gray-500">{orders?.length || 0} orders</span>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-6">Your order history will appear here once you start shopping.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders as Order[]).map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">Order #{order.order_number}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusColors[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {order.status}
                  </span>
                  <span className="text-base font-black text-gray-900">{formatCurrency(order.total)}</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="px-5 py-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-gray-100">
                      <Image
                        src={(item as {image: string}).image || 'https://via.placeholder.com/40'}
                        alt={(item as {title: string}).title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {(order.items?.length || 0) > 3 && (
                    <div className="w-10 h-10 rounded-lg border-2 border-white bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                      +{(order.items?.length || 0) - 3}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {order.items?.map((i) => (i as {title: string}).title).join(', ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
