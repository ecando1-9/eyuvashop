'use client';

import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import Link from 'next/link';
import { ShoppingBag, Heart, Package, MapPin, Ticket, Bell, Headphones, User, Settings, LogOut } from 'lucide-react';

export default function CustomerDashboard() {
  const sidebarItems = [
    { label: 'Dashboard Overview', icon: User, active: true },
    { label: 'Orders & Tracking', icon: Package },
    { label: 'Wishlist Items', icon: Heart },
    { label: 'Cart Items', icon: ShoppingBag },
    { label: 'Saved Addresses', icon: MapPin },
    { label: 'Coupons & Offers', icon: Ticket },
    { label: 'Notifications', icon: Bell },
    { label: 'Support Tickets', icon: Headphones },
    { label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-fit space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-[#FF6B00] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                JD
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">John Doe</h3>
                <p className="text-xs text-gray-400">john.doe@example.com</p>
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                      item.active
                        ? 'bg-[#FF6B00] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </button>
                );
              })}
              <Link
                href="/auth/login"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut className="w-4 h-4" /> Logout Account
              </Link>
            </nav>
          </aside>

          {/* Main Dashboard Overview */}
          <div className="md:col-span-3 space-y-8">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-medium">Total Orders</p>
                <h4 className="text-2xl font-black text-gray-900 mt-1">12</h4>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-medium">Pending Orders</p>
                <h4 className="text-2xl font-black text-[#FF6B00] mt-1">1</h4>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-medium">Wishlist Items</p>
                <h4 className="text-2xl font-black text-gray-900 mt-1">4</h4>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-medium">Coupons Saved</p>
                <h4 className="text-2xl font-black text-emerald-600 mt-1">3</h4>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-gray-900">Recent Orders</h3>
                <a href="#" className="text-xs font-bold text-[#FF6B00] hover:underline">View All Orders</a>
              </div>

              <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-gray-400">Order ID:</span> <span className="font-bold text-gray-900">#ORD-94820</span>
                  </div>
                  <span className="bg-amber-50 text-amber-600 font-bold px-2.5 py-1 rounded-full">In Transit</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Apple iPhone 15 Pro Max</h4>
                    <p className="text-xs text-gray-400">Qty: 1 • Seller: Apple Flagship Store</p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-gray-900">₹156,900</div>
                    <p className="text-[11px] text-gray-400">Placed on Aug 02, 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
