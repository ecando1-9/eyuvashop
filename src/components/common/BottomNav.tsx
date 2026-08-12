'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useEffect, useState } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.getTotalCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Categories', href: '/categories', icon: Grid },
    { label: 'Search', href: '/products', icon: Search },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, badge: mounted ? cartCount : 0 },
    { label: 'Account', href: '/account/settings', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1 shadow-md">
      <nav className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-0.5 relative transition-all duration-150 ${
                isActive ? 'text-[#FF6B00] font-medium' : 'text-gray-500 hover:text-gray-800'
              }`}
              suppressHydrationWarning
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {mounted && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF6B00] text-white text-[9px] font-bold h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

