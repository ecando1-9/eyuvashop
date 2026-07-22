'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative w-full bg-slate-100 flex items-center" style={{ minHeight: '500px' }}>
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156858/kalyani_night_red_color_wwljgh.jpg"
          alt="Banner"
          fill
          className="object-cover object-top opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 z-10 relative">
        <div className="max-w-2xl space-y-6">
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full">
            Premium Women's Wear
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight font-display">
            Comfortable Nighties &amp; Daily Wear
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Explore authentic, high-quality models like Kalyani, Frock, and Round Neck. Shop confidently with actual product photos and premium fabrics.
          </p>
          <div className="pt-4 flex gap-4">
            <Link
              href="/shop?category=nighties"
              className="inline-flex items-center gap-2 bg-[#ff3e6c] hover:bg-[#e02a55] text-white font-bold px-8 py-4 rounded-full transition-colors"
            >
              Shop Nighties <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
