'use client';

import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { BottomNav } from '@/components/common/BottomNav';
import { AccountSidebar } from '@/components/account/AccountSidebar';

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
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
