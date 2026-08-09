'use client';

import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import { AccountSidebar } from '@/components/account/AccountSidebar';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Heart, ShoppingBag, MapPin,
  Star, History, Bell, Ticket, CreditCard, RotateCcw,
  Headphones, Shield, Settings,
} from 'lucide-react';

const mobileNavItems = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard, exact: true },
  { label: 'Orders', href: '/account/orders', icon: Package },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'Cart', href: '/account/cart', icon: ShoppingBag },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Payments', href: '/account/payments', icon: CreditCard },
  { label: 'Returns', href: '/account/returns', icon: RotateCcw },
  { label: 'Reviews', href: '/account/reviews', icon: Star },
  { label: 'History', href: '/account/recently-viewed', icon: History },
  { label: 'Alerts', href: '/account/notifications', icon: Bell },
  { label: 'Coupons', href: '/account/coupons', icon: Ticket },
  { label: 'Support', href: '/account/support', icon: Headphones },
  { label: 'Security', href: '/account/security', icon: Shield },
  { label: 'Settings', href: '/account/settings', icon: Settings },
];

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {/* Mobile Account Navigation Pill Bar */}
        <div className="md:hidden mb-5 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all shadow-xs ${
                  active
                    ? 'bg-[#FF6B00] text-white shadow-sm scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Sidebar — Desktop Only */}
          <div className="hidden md:block sticky top-24">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
