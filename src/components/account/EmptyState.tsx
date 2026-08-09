'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-[#FF6B00] opacity-80" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md"
          >
            {actionLabel}
          </Link>
        )}
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && secondaryHref && (
          <Link
            href={secondaryHref}
            className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
