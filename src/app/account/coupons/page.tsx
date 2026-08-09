'use client';

import { useState, useEffect } from 'react';
import { Ticket, Copy, CheckCheck, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonCard } from '@/components/account/SkeletonLoader';

type CouponTab = 'available' | 'used' | 'expired';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'flat' | 'percent';
  value: number;
  min_order_amount: number;
  max_discount?: number;
  valid_until?: string;
  is_active: boolean;
}

interface CouponUsage {
  id: string;
  used_at: string;
  coupon: Coupon;
}

export default function CouponsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CouponTab>('available');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    fetchCoupons();
  }, [user]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const [availRes, usedRes] = await Promise.all([
        supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .or(`valid_until.is.null,valid_until.gt.${now}`)
          .order('created_at', { ascending: false }),

        supabase
          .from('coupon_usage')
          .select('id, used_at, coupon:coupons(*)')
          .eq('user_id', user!.id)
          .order('used_at', { ascending: false }),
      ]);

      setAvailableCoupons((availRes.data || []) as Coupon[]);
      setUsedCoupons((usedRes.data || []) as unknown as CouponUsage[]);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const now = new Date();
  const expiredCoupons = availableCoupons.filter(
    (c) => c.valid_until && new Date(c.valid_until) < now
  );
  const activeCoupons = availableCoupons.filter(
    (c) => !c.valid_until || new Date(c.valid_until) >= now
  );

  const renderCouponCard = (coupon: Coupon, used = false) => {
    const isExpired = coupon.valid_until && new Date(coupon.valid_until) < now;
    const isCopied = copiedCode === coupon.code;

    return (
      <div
        key={coupon.id}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
          used || isExpired ? 'opacity-60 border-gray-100' : 'border-orange-100 hover:shadow-md'
        }`}
      >
        {/* Left colored strip + code */}
        <div className="flex">
          <div className={`w-3 flex-shrink-0 ${used || isExpired ? 'bg-gray-200' : 'bg-[#FF6B00]'}`} />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className={`font-black text-lg tracking-widest ${used || isExpired ? 'text-gray-400' : 'text-[#FF6B00]'}`}>
                  {coupon.code}
                </p>
                <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                  {coupon.type === 'flat'
                    ? `₹${coupon.value.toLocaleString('en-IN')} OFF`
                    : `${coupon.value}% OFF`}
                  {coupon.max_discount && coupon.type === 'percent' && (
                    <span className="text-gray-400 font-semibold text-xs ml-1">(up to ₹{coupon.max_discount})</span>
                  )}
                </p>
              </div>

              {!used && !isExpired && (
                <button
                  onClick={() => copyCode(coupon.code)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isCopied
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'border-orange-200 text-[#FF6B00] hover:bg-orange-50'
                  }`}
                >
                  {isCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {coupon.description && (
              <p className="text-xs text-gray-500 mb-2">{coupon.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
              {coupon.min_order_amount > 0 && (
                <span>Min order ₹{coupon.min_order_amount.toLocaleString('en-IN')}</span>
              )}
              {coupon.valid_until && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isExpired ? 'Expired' : `Valid till ${new Date(coupon.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </span>
              )}
              {used && <span className="text-green-600 font-semibold">✓ Used</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Coupons & Offers</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeCoupons.length} coupon{activeCoupons.length !== 1 ? 's' : ''} available</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['available', 'used', 'expired'] as CouponTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-xs font-bold transition-colors capitalize border-b-2 ${
                activeTab === tab ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="p-5">
            {activeTab === 'available' && (
              activeCoupons.length === 0 ? (
                <EmptyState icon={Ticket} title="No coupons available" description="Check back later for exclusive offers and discount codes." />
              ) : (
                <div className="space-y-3">
                  {activeCoupons.map((c) => renderCouponCard(c))}
                </div>
              )
            )}
            {activeTab === 'used' && (
              usedCoupons.length === 0 ? (
                <EmptyState icon={Ticket} title="No coupons used yet" description="When you use a coupon on an order, it will appear here." />
              ) : (
                <div className="space-y-3">
                  {usedCoupons.map((u) => renderCouponCard(u.coupon, true))}
                </div>
              )
            )}
            {activeTab === 'expired' && (
              expiredCoupons.length === 0 ? (
                <EmptyState icon={Ticket} title="No expired coupons" description="Expired coupons will show up here." />
              ) : (
                <div className="space-y-3">
                  {expiredCoupons.map((c) => renderCouponCard(c))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
