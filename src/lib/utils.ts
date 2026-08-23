import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function sanitizeInput(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/[<>]/g, "").trim();
}

export function allowOnlyDigits(str: string): string {
  if (!str) return "";
  return str.replace(/\D/g, "");
}


export function getDefaultCategoryImage(name: string): string {
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('electronic') || normalized.includes('tech') || normalized.includes('mobile') || normalized.includes('laptop')) {
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80'; // electronics
  }
  if (normalized.includes('fashion') || normalized.includes('cloth') || normalized.includes('wear') || normalized.includes('apparel') || normalized.includes('shirt')) {
    return 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80'; // fashion
  }
  if (normalized.includes('grocery') || normalized.includes('food') || normalized.includes('vegetable') || normalized.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'; // grocery
  }
  if (normalized.includes('home') || normalized.includes('furniture') || normalized.includes('decor')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80'; // home
  }
  if (normalized.includes('beauty') || normalized.includes('cosmetic') || normalized.includes('makeup') || normalized.includes('skincare')) {
    return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80'; // beauty
  }
  if (normalized.includes('sport') || normalized.includes('fitness') || normalized.includes('gym')) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80'; // sports
  }
  if (normalized.includes('toy') || normalized.includes('kid') || normalized.includes('baby')) {
    return 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80'; // toys
  }
  if (normalized.includes('book') || normalized.includes('stationery') || normalized.includes('study')) {
    return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'; // books
  }
  if (normalized.includes('jewelry') || normalized.includes('watch')) {
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80'; // jewelry
  }
  if (normalized.includes('shoe') || normalized.includes('footwear')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'; // shoes
  }
  if (normalized.includes('health') || normalized.includes('medicine')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5e41df747?w=400&q=80'; // health
  }
  
  // Generic fallback shopping image
  return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80';
}
