'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, Heart, ShoppingBag, MapPin, Star, History,
  Bell, Ticket, CreditCard, RotateCcw, Headphones,
  CheckCircle2, ArrowRight, Eye, ShoppingCart, Trash2,
  TrendingUp, Clock, Shield, Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SkeletonStats, SkeletonCard, SkeletonOrderCard } from '@/components/account/SkeletonLoader';
import { EmptyState } from '@/components/account/EmptyState';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  wishlistCount: number;
  cartCount: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  item_count: number;
}

interface RecentlyViewedProduct {
  id: string;
  viewed_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number;
    rating: number;
    images?: { url: string; is_primary: boolean }[];
    store?: { name: string };
  };
}

const quickActions = [
  { label: 'My Orders', desc: 'Track your orders', href: '/account/orders', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { label: 'Wishlist', desc: 'Your saved products', href: '/account/wishlist', icon: Heart, color: 'bg-pink-50 text-pink-600' },
  { label: 'My Cart', desc: 'Products awaiting checkout', href: '/account/cart', icon: ShoppingBag, color: 'bg-orange-50 text-[#FF6B00]' },
  { label: 'Addresses', desc: 'Manage delivery locations', href: '/account/addresses', icon: MapPin, color: 'bg-green-50 text-green-600' },
  { label: 'Payment Methods', desc: 'Saved cards & UPI', href: '/account/payments', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Returns & Refunds', desc: 'Manage returns', href: '/account/returns', icon: RotateCcw, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'My Reviews', desc: 'Manage your reviews', href: '/account/reviews', icon: Star, color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Recently Viewed', desc: 'Products you explored', href: '/account/recently-viewed', icon: History, color: 'bg-purple-50 text-purple-600' },
  { label: 'Notifications', desc: 'Stay updated', href: '/account/notifications', icon: Bell, color: 'bg-red-50 text-red-600' },
  { label: 'Coupons & Offers', desc: 'Save more money', href: '/account/coupons', icon: Ticket, color: 'bg-teal-50 text-teal-600' },
  { label: 'Help & Support', desc: 'Customer support', href: '/account/support', icon: Headphones, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Security', desc: 'Password & Auth', href: '/account/security', icon: Shield, color: 'bg-[#0B1E3D]/10 text-[#0B1E3D]' },
  { label: 'Settings', desc: 'Preferences & Profile', href: '/account/settings', icon: Settings, color: 'bg-gray-100 text-gray-700' },
];

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[status] || status;
}

export default function AccountDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const cartCount = useCartStore((state) => state.getTotalCount());
  const wishlistItems = useWishlistStore((state) => state.items);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const ordersRes = await supabase
          .from('orders')
          .select('id, status', { count: 'exact' })
          .eq('user_id', user.id);

        const recentOrdersRes = await supabase
          .from('orders')
          .select('id, order_number, status, payment_status, total_amount, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const recentlyViewedRes = await supabase
          .from('recently_viewed')
          .select(`
            id,
            viewed_at,
            product:products(
              id,
              title,
              price,
              compare_at_price,
              rating,
              images:product_images(url, is_primary)
            )
          `)
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(8);

        const allOrders = ordersRes.data || [];
        const pendingOrders = allOrders.filter((o: any) =>
          ['pending', 'processing', 'confirmed', 'shipped'].includes(o.status)
        ).length;

        setStats({
          totalOrders: ordersRes.count || 0,
          pendingOrders,
          wishlistCount: wishlistItems.length,
          cartCount,
        });

        const formattedOrders = (recentOrdersRes.data || []).map((o: any) => ({
          ...o,
          item_count: o.order_items?.length || 0,
        }));
        setRecentOrders(formattedOrders);

        // Filter out any null products
        const viewed = (recentlyViewedRes.data || []).filter((v: any) => v.product);
        setRecentlyViewed(viewed as unknown as RecentlyViewedProduct[]);
      } catch {
        // Silently handle empty dashboard states
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, cartCount, wishlistItems.length]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonOrderCard />
      </div>
    );
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recent Member';

  return (
    <div className="space-y-6">
      {/* Mobile Profile Card */}
      <div className="md:hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-2xl shadow-md flex-shrink-0 overflow-hidden relative">
            {profile?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              (profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ||
                user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ||
                user?.email?.slice(0, 2).toUpperCase() || 'U')
            )}
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900">
              {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h2>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-semibold">Verified</span>
              <span className="text-xs text-gray-400">· Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats?.totalOrders ?? 0, color: 'text-[#FF6B00]', icon: Package },
            { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, color: 'text-blue-600', icon: Clock },
            { label: 'Wishlist Items', value: stats?.wishlistCount ?? 0, color: 'text-pink-600', icon: Heart },
            { label: 'Cart Items', value: stats?.cartCount ?? 0, color: 'text-emerald-600', icon: ShoppingBag },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-semibold">{stat.label}</p>
                  <Icon className={`w-4 h-4 ${stat.color} opacity-70`} />
                </div>
                <h4 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h4>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#FF6B00]" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-xs leading-tight">{action.label}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF6B00]" /> Recent Orders
          </h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonOrderCard key={i} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Start shopping and your orders will appear here."
            actionLabel="Start Shopping"
            actionHref="/"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="font-bold text-sm text-gray-900">#{order.order_number}</span>
                    <span className="text-gray-400 text-xs ml-2">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#FF6B00] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Order
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Viewed */}
      {!loading && recentlyViewed.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-[#FF6B00]" /> Recently Viewed
            </h2>
            <Link href="/account/recently-viewed" className="flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5">
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {recentlyViewed.slice(0, 6).map((item) => {
                const product = item.product;
                const image = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url;
                const discount = product.compare_at_price
                  ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-40 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="relative h-36 bg-gray-100">
                        {image ? (
                          <Image src={image} alt={product.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{product.title}</p>
                        {product.store && (
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.store.name}</p>
                        )}
                        <p className="text-sm font-black text-gray-900 mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
