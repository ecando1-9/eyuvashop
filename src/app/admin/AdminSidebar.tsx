'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderOpen,
  Users,
  Star,
  Tag,
  Image as ImageIcon,
  CreditCard,
  Truck,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Props {
  profile: { first_name?: string; email: string; role: string };
  isOpen: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/business-insights', label: 'Business Insights', icon: Sparkles },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/coupons', label: 'Coupons', icon: Tag },
      { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({ profile, isOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out!');
    router.push('/');
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-950 text-white border-r border-slate-800/80 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="px-4 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <Image src="/eyuvashop.png" alt="eYuvaShop" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">eYuvaShop</p>
            <p className="text-[10px] text-slate-400">Admin Control Center</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] px-2 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(profile.first_name || profile.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile.first_name || 'Admin'}</p>
            <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
