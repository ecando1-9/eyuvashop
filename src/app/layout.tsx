import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import '../styles/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['700'],
  style: ['italic', 'normal'],
});

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
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable} ${cormorantGaramond.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50">{children}</body>
    </html>
  );
}
