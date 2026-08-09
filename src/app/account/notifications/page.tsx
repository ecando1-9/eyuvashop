'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Package, Truck, CreditCard, Heart, Tag, Layers, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonLine } from '@/components/account/SkeletonLoader';

type NotifCategory = 'all' | 'orders' | 'delivery' | 'payments' | 'wishlist' | 'offers' | 'products' | 'system';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

const CATEGORY_TABS: { label: string; value: NotifCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Orders', value: 'orders' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Payments', value: 'payments' },
  { label: 'Offers', value: 'offers' },
  { label: 'System', value: 'system' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  orders: Package,
  delivery: Truck,
  payments: CreditCard,
  wishlist: Heart,
  offers: Tag,
  products: Layers,
  system: Settings,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const { user, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotifCategory>('all');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('category', activeTab);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setNotifications((data || []) as Notification[]);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user!.id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    refreshProfile();
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshProfile();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id).eq('user_id', user!.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    refreshProfile();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#FF6B00] font-semibold mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#FF6B00] transition-colors border border-gray-200 px-3 py-2 rounded-xl"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
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

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <SkeletonLine className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="h-4 w-2/3" />
                  <SkeletonLine className="h-3 w-full" />
                  <SkeletonLine className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! Notifications about your orders, offers, and updates will appear here."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => {
              const Icon = CATEGORY_ICONS[notif.category] || Bell;
              return (
                <div
                  key={notif.id}
                  className={`p-4 flex gap-3 hover:bg-gray-50/50 transition-colors group ${
                    !notif.is_read ? 'bg-orange-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.is_read ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-[#FF6B00]'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notif.title}
                        {!notif.is_read && (
                          <span className="inline-block w-2 h-2 bg-[#FF6B00] rounded-full ml-2 mb-0.5" />
                        )}
                      </p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      {!notif.is_read && (
                        <button
                          onClick={() => markRead(notif.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#FF6B00] hover:underline"
                        >
                          <Check className="w-3 h-3" /> Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
