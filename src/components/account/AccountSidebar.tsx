'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Heart, ShoppingBag, MapPin,
  Star, History, Bell, Ticket, CreditCard, RotateCcw,
  Headphones, Shield, Settings, LogOut, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard, exact: true },
  { label: 'My Orders', href: '/account/orders', icon: Package },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'My Cart', href: '/account/cart', icon: ShoppingBag },
  { label: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'My Reviews', href: '/account/reviews', icon: Star },
  { label: 'Recently Viewed', href: '/account/recently-viewed', icon: History },
  { label: 'Notifications', href: '/account/notifications', icon: Bell },
  { label: 'Coupons & Offers', href: '/account/coupons', icon: Ticket },
  { label: 'Payment Methods', href: '/account/payments', icon: CreditCard },
  { label: 'Returns & Refunds', href: '/account/returns', icon: RotateCcw },
  { label: 'Help & Support', href: '/account/support', icon: Headphones },
  { label: 'Security', href: '/account/security', icon: Shield },
  { label: 'Settings', href: '/account/settings', icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { user, profile, unreadNotifications, signOut } = useAuth();

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm h-fit overflow-hidden">
      {/* Profile Section */}
      <div className="p-5 bg-gradient-to-br from-[#FF6B00]/5 to-orange-50/30 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
              {userInitials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-extrabold text-gray-900 text-sm truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-emerald-600 font-semibold">Verified</span>
              {memberSince && (
                <span className="text-[11px] text-gray-400 ml-1 truncate">· Since {memberSince}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                active
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6B00]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#FF6B00]'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === '/account/notifications' && unreadNotifications > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  active ? 'bg-white/30 text-white' : 'bg-[#FF6B00] text-white'
                }`}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-2 border-t border-gray-100 mt-2">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
