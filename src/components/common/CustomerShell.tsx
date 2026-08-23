'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isCustomer = 
    !pathname.startsWith('/admin') && 
    !pathname.startsWith('/merchant') && 
    !pathname.startsWith('/auth') && 
    !pathname.startsWith('/login') && 
    !pathname.startsWith('/register');

  if (!isCustomer) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-grow w-full">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
