import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-24 md:pb-12 border-t border-gray-800">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        {/* Customer Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-xl text-[#FF6B00]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Free Express Shipping</h4>
              <p className="text-xs text-gray-400">On all orders above ₹999</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-xl text-[#FF6B00]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">7-Day Easy Returns</h4>
              <p className="text-xs text-gray-400">Hassle-free refunds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-xl text-[#FF6B00]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">100% Secure Payment</h4>
              <p className="text-xs text-gray-400">Encrypted transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-xl text-[#FF6B00]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">24/7 Priority Support</h4>
              <p className="text-xs text-gray-400">Dedicated helpline</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Brand & About */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src="https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png"
                  alt="eYuvaShop Logo"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <span className="font-extrabold text-xl text-white italic">
                <span className="text-[#FF6B00] not-italic">e</span>
                <span className="text-white">YuvaShop</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Next-generation multi-vendor e-commerce platform powering thousands of independent sellers and delivering premium products across India with speed and security.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Shop</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/category/electronics" className="hover:text-[#FF6B00] transition-colors">Electronics</Link></li>
              <li><Link href="/category/fashion" className="hover:text-[#FF6B00] transition-colors">Fashion & Apparel</Link></li>
              <li><Link href="/category/home-living" className="hover:text-[#FF6B00] transition-colors">Home & Living</Link></li>
              <li><Link href="/category/beauty" className="hover:text-[#FF6B00] transition-colors">Beauty & Personal Care</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/account/orders" className="hover:text-[#FF6B00] transition-colors">Track Orders</Link></li>
              <li><Link href="/help/returns" className="hover:text-[#FF6B00] transition-colors">Return Policy</Link></li>
              <li><Link href="/help/shipping" className="hover:text-[#FF6B00] transition-colors">Shipping Info</Link></li>
              <li><Link href="/help/faq" className="hover:text-[#FF6B00] transition-colors">FAQs & Help Center</Link></li>
            </ul>
          </div>

          {/* Merchant & Admin */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Business</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/merchant" className="hover:text-[#FF6B00] transition-colors font-medium text-[#FF6B00]">Merchant Dashboard</Link></li>
              <li><Link href="/merchant/register" className="hover:text-[#FF6B00] transition-colors">Become a Seller</Link></li>
              <li><Link href="/admin" className="hover:text-[#FF6B00] transition-colors font-medium">Admin Portal</Link></li>
              <li><Link href="/careers" className="hover:text-[#FF6B00] transition-colors">Careers</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} eYuvashop Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400">Terms of Service</Link>
            <Link href="/security" className="hover:text-gray-400">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
