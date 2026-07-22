'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Product } from '@/types';
import { calculateDiscount, formatCurrency } from '@/lib/utils';

interface LimitedOffersProps {
  products: Product[];
}

function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-white">
      {['h', 'm', 's'].map((unit, i) => (
        <span key={unit} className="flex items-center gap-0.5">
          <span className="font-black text-lg bg-white/20 px-1.5 py-0.5 rounded min-w-[32px] text-center">
            {pad([timeLeft.h, timeLeft.m, timeLeft.s][i])}
          </span>
          {i < 2 && <span className="font-black text-lg">:</span>}
        </span>
      ))}
    </div>
  );
}

const OFFER_EXPIRY = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

export default function LimitedOffers({ products }: LimitedOffersProps) {
  const displayProducts = products.filter(
    (p) => p.compare_price && p.compare_price > p.price
  );

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-orange-600 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">⚡ Limited Time Offers</h2>
            <p className="text-orange-100 text-sm">Grab these deals before time runs out!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-orange-100 text-sm">
              <Clock size={16} />
              <span>Ends in:</span>
            </div>
            <CountdownTimer endTime={OFFER_EXPIRY} />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayProducts.slice(0, 10).map((product) => {
          const discount = calculateDiscount(product.price, product.compare_price);
          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-2xl border-2 border-red-100 overflow-hidden hover:border-orange-400 hover:shadow-lg transition-all duration-200"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Image
                  src={product.images?.[0] || 'https://via.placeholder.com/300'}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-md animate-pulse-orange">
                  -{discount}%
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                  {product.title}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compare_price!)}</span>
                </div>
                <div className="mt-2 text-xs font-bold text-green-600">
                  You save {formatCurrency(product.compare_price! - product.price)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
