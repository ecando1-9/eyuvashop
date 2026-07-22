'use client';

import Link from 'next/link';
import { Menu, Bell, Search, Plus } from 'lucide-react';

interface Props {
  profile: { first_name?: string; email: string; role: string };
  onMenuClick: () => void;
}

export default function AdminTopbar({ profile, onMenuClick }: Props) {
  const initials = (profile.first_name || profile.email)[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-full px-3 py-2 w-full max-w-md">
            <Search size={14} className="text-slate-400" />
            <input
              placeholder="Search orders, products, customers"
              className="bg-transparent border-0 outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="hidden sm:inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-sm shadow-orange-200 transition-colors"
          >
            <Plus size={14} />
            New Product
          </Link>
          <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600">
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{profile.first_name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500">Owner</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

