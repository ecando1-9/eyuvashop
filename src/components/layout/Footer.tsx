import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Shield,
  Truck,
  RefreshCcw,
  Headphones,
} from 'lucide-react';

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Best Sellers', href: '/shop?sort=popular' },
    { label: 'Offers', href: '/shop?offers=true' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Returns and Refunds', href: '/returns' },
    { label: 'Shipping Info', href: '/shipping' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
};

const trustBadges = [
  { icon: Shield, label: 'Secure Payments', sub: '100% safe and encrypted' },
  { icon: Truck, label: 'Fast Delivery', sub: 'Pan-India in 2-5 days' },
  { icon: RefreshCcw, label: 'Easy Returns', sub: '30-day return policy' },
  { icon: Headphones, label: '24/7 Support', sub: 'Always here to help' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Trust Badges Area inline */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex flex-col items-center text-center gap-3 group">
                <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center transform group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300">
                  <badge.icon size={24} className="text-[#ff3e6c]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">{badge.label}</p>
                  <p className="text-xs text-slate-500 font-medium">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12">
          <div className="lg:col-span-2 pr-4">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                <Image src="/eyuvashop.png" alt="eYuvaShop" width={32} height={32} className="object-cover" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight font-display">
                eYuvaShop
              </span>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-8">
              Experience the highest quality women's wear, tailored for your premium styling needs. Genuine products, secure payments, easy shopping.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Youtube, href: '#', label: 'YouTube' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-slate-100 hover:bg-[#ff3e6c] text-slate-600 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Company</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-[#ff3e6c] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#ff3e6c] transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Shop</h3>
            <ul className="space-y-4">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-[#ff3e6c] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#ff3e6c] transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Support</h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-[#ff3e6c] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#ff3e6c] transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Contact Us</h3>
            <ul className="space-y-5">
              <li>
                <a
                  href="tel:18000000000"
                  className="flex items-start gap-4 text-sm font-medium text-slate-600 hover:text-[#ff3e6c] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-[#ff3e6c]" />
                  </div>
                  <span className="mt-1.5">1800-000-0000</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@eyuvashop.com"
                  className="flex items-start gap-4 text-sm font-medium text-slate-600 hover:text-[#ff3e6c] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-[#ff3e6c]" />
                  </div>
                  <span className="mt-1.5 break-all">support@eyuvashop.com</span>
                </a>
              </li>
              <li className="flex items-start gap-4 text-sm font-medium text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center shrink-0">
                  <MapPin size={14} className="text-[#ff3e6c]" />
                </div>
                <span className="mt-1">123, Tech Premium Park, Hyderabad - 500082</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 py-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500">
            &copy; {new Date().getFullYear()} eYuvaShop. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.slice(0, 3).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
