'use client';

import { Package, Inbox, Store, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'product' | 'store' | 'inbox' | 'sparkles';
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = 'product',
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const renderIcon = () => {
    switch (icon) {
      case 'store':
        return <Store className="w-10 h-10 text-[#FF6B00]" />;
      case 'sparkles':
        return <Sparkles className="w-10 h-10 text-[#FF6B00]" />;
      case 'inbox':
        return <Inbox className="w-10 h-10 text-[#FF6B00]" />;
      case 'product':
      default:
        return <Package className="w-10 h-10 text-[#FF6B00]" />;
    }
  };

  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center justify-center space-y-4 shadow-sm my-4">
      <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center shadow-inner">
        {renderIcon()}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-extrabold text-gray-900 text-base md:text-lg">{title}</h3>
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && (actionHref ? (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </Link>
      ) : onAction ? (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </button>
      ) : null)}
    </div>
  );
}
