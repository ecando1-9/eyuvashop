'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  Shield,
  ShoppingCart,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

interface Props { profile: Profile | null; }

const navItems = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'My Cart', icon: ShoppingCart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/profile', label: 'Profile Settings', icon: User },
  { href: '/account/security', label: 'Security', icon: Shield },
];

export default function AccountSidebar({ profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out!');
    router.push('/');
    router.refresh();
  };

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                isActive
                  ? 'bg-orange-50 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon size={16} className={isActive ? 'text-orange-500' : 'text-gray-400'} />
                {item.label}
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </nav>
    </aside>
  );
}
