import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    template: '%s | eYuvaShop',
    default: 'eYuvaShop – Shop Smart, Live Better',
  },
  description:
    'eYuvaShop is India\'s premium online shopping destination. Discover fashion, electronics, beauty, and more with fast delivery and easy returns.',
  keywords: ['eYuvaShop', 'online shopping', 'India', 'fashion', 'electronics', 'beauty'],
  openGraph: {
    type: 'website',
    siteName: 'eYuvaShop',
    title: 'eYuvaShop – Shop Smart, Live Better',
    description: 'India\'s premium online shopping destination.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#f97316', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
