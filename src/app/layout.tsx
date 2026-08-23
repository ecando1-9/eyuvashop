import type { Metadata } from 'next';
import '../styles/globals.css';

import { CustomerShell } from '@/components/common/CustomerShell';

export const metadata: Metadata = {
  title: 'eYuvaShop | Fashion & Lifestyle Multi-Vendor Platform',
  description: 'Premium Multi-Vendor Shopping Engine - Fashion, Lifestyle & Tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <CustomerShell>{children}</CustomerShell>
      </body>
    </html>
  );
}
