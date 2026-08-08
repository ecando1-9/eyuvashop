'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingBag, Package, Grid, Layers, Users, Star, TrendingUp, DollarSign, Tag, Store, Settings, LogOut, Bell, Plus, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

const LOGO_URL = "https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png";

export default function MerchantDashboard() {
  const [orders] = useState<any[]>([]);
  const [products] = useState<any[]>([]);
  const merchantName = "eYuvashop Merchant";

  const sidebarNav = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Orders', icon: ShoppingBag, badge: orders.length > 0 ? `${orders.length} New` : undefined },
    { label: 'Products', icon: Package },
    { label: 'Categories', icon: Grid },
    { label: 'Inventory', icon: Layers },
    { label: 'Customers', icon: Users },
    { label: 'Reviews', icon: Star },
    { label: 'Analytics', icon: TrendingUp },
    { label: 'Revenue', icon: DollarSign },
    { label: 'Coupons', icon: Tag },
    { label: 'Store Settings', icon: Store },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans">
      {/* Sidebar - Clean Light Theme like Shopify / Amazon Seller */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden lg:flex shadow-sm">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <span className="font-extrabold text-lg tracking-tight italic">
              <span className="text-[#FF6B00] not-italic">e</span>
              <span className="text-[#1E293B]">YuvaShop</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-[#FF6B00] text-white shadow-md'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6B00]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" /> {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <Link href="/auth/login" className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Exit Seller Hub
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden lg:hidden border border-gray-100">
              <Image src={LOGO_URL} alt="eYuvashop Logo" fill className="object-cover" />
            </div>
            <h1 className="font-black text-lg text-[#0B1E3D]">Seller Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-[#FF6B00] bg-gray-100 rounded-xl relative">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-bold text-xs text-[#FF6B00]">
                {merchantName.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-gray-800">{merchantName}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Metrics Row - Bright cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Today's Sales</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{formatCurrency(0)}</h3>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">No sales recorded today</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Today's Orders</p>
              <h3 className="text-2xl font-black text-[#FF6B00] mt-1">{orders.length}</h3>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">0 pending orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Monthly Revenue</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{formatCurrency(0)}</h3>
              <p className="text-[11px] text-emerald-600 mt-2 font-semibold">Real-time sync active</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 font-medium">Store Products</p>
              <h3 className="text-2xl font-black text-[#0B1E3D] mt-1">{products.length}</h3>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">Live in store catalog</p>
            </div>
          </div>

          {/* Order Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-[#0B1E3D]">Recent Store Orders</h3>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <h4 className="font-bold text-gray-900">Order #{order.id}</h4>
                        <p className="text-gray-500">Customer: {order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-gray-900">{formatCurrency(order.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Orders Found"
                  description="New store orders will appear here in real-time as customers purchase your items."
                  icon="inbox"
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-base text-[#0B1E3D]">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add New Product
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-3 rounded-xl transition-colors">
                  Request New Category
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-3 rounded-xl transition-colors">
                  Update Store Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
