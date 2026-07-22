import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Package, Heart, MapPin, ShoppingCart, ArrowRight, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [ordersResult, wishlistResult, addressResult] = await Promise.all([
    supabase.from('orders').select('id, order_number, status, total, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('wishlist_items').select('id', { count: 'exact' }).eq('user_id', user!.id),
    supabase.from('addresses').select('id', { count: 'exact' }).eq('user_id', user!.id),
  ]);

  const orders = (ordersResult.data || []) as Order[];
  const wishlistCount = wishlistResult.count || 0;
  const addressCount = addressResult.count || 0;

  const statCards = [
    { label: 'Total Orders', value: String(ordersResult.data?.length || 0), icon: Package, href: '/account/orders', color: 'blue' },
    { label: 'Wishlist Items', value: String(wishlistCount), icon: Heart, href: '/account/wishlist', color: 'red' },
    { label: 'Saved Addresses', value: String(addressCount), icon: MapPin, href: '/account/addresses', color: 'green' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    packed: 'bg-purple-50 text-purple-700',
    shipped: 'bg-indigo-50 text-indigo-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 text-white">
        <h1 className="text-xl font-black mb-1">Welcome back! 👋</h1>
        <p className="text-orange-100 text-sm">Manage your orders, wishlist, and account settings here.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-md transition-all text-center group"
          >
            <card.icon size={24} className={`mx-auto mb-2 ${card.color === 'blue' ? 'text-blue-400' : card.color === 'red' ? 'text-red-400' : 'text-green-400'}`} />
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 group-hover:text-orange-500 transition-colors">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            Recent Orders
          </h2>
          <Link href="/account/orders" className="text-xs text-orange-500 font-semibold hover:text-orange-700 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No orders yet</p>
            <Link href="/shop" className="text-sm font-semibold text-orange-500 hover:text-orange-700">
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-orange-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">#{order.order_number}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || 'bg-gray-50 text-gray-600'}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/shop" className="bg-orange-50 border border-orange-100 rounded-2xl p-4 hover:bg-orange-100 transition-colors flex items-center gap-3">
          <ShoppingCart size={20} className="text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">Continue Shopping</span>
        </Link>
        <Link href="/track-order" className="bg-blue-50 border border-blue-100 rounded-2xl p-4 hover:bg-blue-100 transition-colors flex items-center gap-3">
          <Package size={20} className="text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">Track Order</span>
        </Link>
      </div>
    </div>
  );
}
