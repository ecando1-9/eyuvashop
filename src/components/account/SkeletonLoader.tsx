'use client';

// Skeleton loader components for account pages

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 space-y-3 ${className}`}>
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-3 w-2/3" />
      <SkeletonLine className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
        <SkeletonLine className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonLine className="h-16 w-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
        <div className="space-y-2 text-right">
          <SkeletonLine className="h-5 w-20" />
          <SkeletonLine className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <SkeletonLine className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
        <SkeletonLine className="h-5 w-1/3" />
        <SkeletonLine className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <SkeletonLine className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonLine className="h-5 w-2/3" />
          <SkeletonLine className="h-4 w-1/2" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse space-y-2">
          <SkeletonLine className="h-3 w-2/3" />
          <SkeletonLine className="h-8 w-1/2" />
        </div>
      ))}
    </div>
  );
}
