'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, Users, Store, Package, Grid, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

export default function AdminDashboard() {
  const [pendingMerchants] = useState<any[]>([]);
  const [activeMerchants] = useState<number>(0);
  const [totalUsers] = useState<number>(0);
  const [totalGmv] = useState<number>(0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between hidden lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <span className="font-extrabold text-lg text-white">
              Admin<span className="text-red-500">Control</span>
            </span>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 bg-red-600/10 text-red-500 rounded-xl">
              <ShieldAlert className="w-4 h-4" /> System Overview
            </a>
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl">
              <Store className="w-4 h-4" /> Merchant Approvals
            </a>
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl">
              <Package className="w-4 h-4" /> Product Catalog
            </a>
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl">
              <Grid className="w-4 h-4" /> Category Approvals
            </a>
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl">
              <Users className="w-4 h-4" /> User Management
            </a>
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl">
              <DollarSign className="w-4 h-4" /> Platform Revenue
            </a>
          </nav>
        </div>

        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-300">
          ← Exit Admin Session
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-gray-950 border-b border-gray-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden lg:hidden">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <h1 className="font-black text-lg text-white">Platform Governance</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">All Systems Operational</span>
          </div>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Platform Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium">Total Platform GMV</p>
              <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(totalGmv)}</h3>
            </div>
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium">Active Merchants</p>
              <h3 className="text-2xl font-black text-[#FF6B00] mt-1">{activeMerchants}</h3>
            </div>
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium">Pending Approvals</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingMerchants.length} Stores</h3>
            </div>
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium">Total Registered Users</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalUsers}</h3>
            </div>
          </div>

          {/* Approvals Table */}
          <div className="bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white">Pending Merchant Approvals</h3>
            
            {pendingMerchants.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {pendingMerchants.map((merchant, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{merchant.name}</h4>
                      <p className="text-gray-400">{merchant.email} • Registered {merchant.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Pending Merchant Requests"
                description="All seller registration requests have been reviewed and processed."
                icon="store"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
