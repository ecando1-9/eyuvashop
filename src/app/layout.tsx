import type { Metadata } from 'next';
import '../styles/globals.css';

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
      <body className="font-sans antialiased text-gray-900 bg-gray-50">{children}</body>
    </html>
  );
}
