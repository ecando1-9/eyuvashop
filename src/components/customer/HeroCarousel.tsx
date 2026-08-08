'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/types/database';

interface HeroCarouselProps {
  banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gray-900 text-white min-h-[360px] md:min-h-[440px] flex items-center shadow-xl">
      {/* Background Image */}
      <Image
        src={currentBanner.image_url}
        alt={currentBanner.title}
        fill
        priority
        className="object-cover opacity-40 transition-all duration-700 scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl px-6 md:px-12 py-8 space-y-4">
        <span className="inline-block bg-[#FF6B00] text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
          Featured Collection
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
          {currentBanner.title}
        </h1>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          {currentBanner.description}
        </p>
        <div className="pt-2">
          <Link
            href={currentBanner.cta_url || '/products'}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded-full transition-all shadow-lg hover:gap-3"
          >
            {currentBanner.cta_text || 'Shop Now'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/20"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleNext}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/20"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
