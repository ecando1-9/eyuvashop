'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { X, TrendingUp, TrendingDown, Clock, User, History, ArrowRight } from 'lucide-react';

interface PriceHistoryModalProps {
  productId: string;
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PriceHistoryModal({ productId, productTitle, isOpen, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (!isOpen || !productId || productId === 'new') {
      setLoading(false);
      setHistory([]);
      return;
    }

    async function fetchPriceHistory() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_price_history')
          .select(`
            id, old_price, new_price, old_compare_at_price, new_compare_at_price,
            change_reason, created_at,
            changed_by_user:users!changed_by(full_name, email, role)
          `)
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching price history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPriceHistory();
  }, [productId, isOpen, supabase]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#FF6B00]" />
              <h3 className="font-extrabold text-lg text-gray-900">Price Change History</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">Product: <span className="font-bold text-gray-800">{productTitle}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-gray-500">Loading price history records...</div>
        ) : history.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {history.map((item, idx) => {
              const priceDropped = item.old_price && item.new_price < item.old_price;
              const priceIncreased = item.old_price && item.new_price > item.old_price;
              const userName = item.changed_by_user?.full_name || item.changed_by_user?.email || 'System / Merchant';

              return (
                <div key={item.id || idx} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {priceDropped ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <TrendingDown className="w-3.5 h-3.5" /> Price Reduced
                        </span>
                      ) : priceIncreased ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5" /> Price Increased
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2.5 py-0.5 rounded-full">
                          Price Updated
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    {item.old_price !== null && (
                      <>
                        <span className="text-xs font-bold text-gray-400 line-through">
                          {formatCurrency(item.old_price)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      </>
                    )}
                    <span className="text-base font-black text-gray-900">
                      {formatCurrency(item.new_price)}
                    </span>

                    {item.new_compare_at_price && (
                      <span className="text-xs text-gray-500 font-medium ml-auto">
                        MRP: <span className="line-through">{formatCurrency(item.new_compare_at_price)}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      Changed by: <strong className="text-gray-700">{userName}</strong>
                    </span>
                    <span className="italic text-gray-400">{item.change_reason || 'Manual Update'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-bold text-gray-700">No previous price changes recorded.</p>
            <p className="text-xs text-gray-400">Future price modifications will automatically create detailed audit records here.</p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
