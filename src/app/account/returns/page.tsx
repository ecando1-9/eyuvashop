'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonCard } from '@/components/account/SkeletonLoader';

interface ReturnRequest {
  id: string;
  return_number: string;
  reason: string;
  description?: string;
  status: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
  order: {
    order_number: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  approved: { label: 'Approved', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  received: { label: 'Received', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  refund_processing: { label: 'Refund Processing', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  refunded: { label: 'Refunded', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function ReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    fetchReturns();
  }, [user]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('returns')
        .select(`
          id, return_number, reason, description, status, refund_amount, created_at, updated_at,
          order:orders(order_number)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setReturns((data || []) as unknown as ReturnRequest[]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Returns & Refunds</h1>
        <p className="text-sm text-gray-400 mt-0.5">{returns.length} return request{returns.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
        <p className="font-bold">Return Policy</p>
        <p className="text-xs mt-1 text-blue-600">Returns are accepted within 7 days of delivery. Products must be unused and in original packaging. To initiate a return, go to your Order and click &quot;Return / Refund&quot;.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : returns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No return requests"
            description="You haven't requested any returns yet. If you need to return a product, go to the order and click Return / Refund."
            actionLabel="View Orders"
            actionHref="/account/orders"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {returns.map((ret) => {
              const config = STATUS_CONFIG[ret.status] || STATUS_CONFIG.requested;
              return (
                <div key={ret.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">#{ret.return_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Order #{ret.order?.order_number} · {new Date(ret.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">{ret.reason}</p>
                  {ret.description && <p className="text-xs text-gray-400 mt-1">{ret.description}</p>}
                  {ret.refund_amount && (
                    <p className="text-sm font-bold text-green-600 mt-2">
                      Refund Amount: ₹{ret.refund_amount.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
