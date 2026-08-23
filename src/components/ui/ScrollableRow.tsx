'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableRow({ children, className = '' }: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 1.5 : clientWidth / 1.5;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
      // Delay check to allow smooth scroll to finish
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="relative group">
      {/* Left Button */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white shadow-md border border-gray-100 rounded-full w-10 h-10 flex items-center justify-center text-gray-700 hover:text-[#FF6B00] hover:scale-105 transition-all focus:outline-none ${
          showLeft ? 'opacity-0 sm:group-hover:opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex overflow-x-auto snap-x scrollbar-hide ${className}`}
      >
        {children}
      </div>

      {/* Right Button */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white shadow-md border border-gray-100 rounded-full w-10 h-10 flex items-center justify-center text-gray-700 hover:text-[#FF6B00] hover:scale-105 transition-all focus:outline-none ${
          showRight ? 'opacity-0 sm:group-hover:opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
