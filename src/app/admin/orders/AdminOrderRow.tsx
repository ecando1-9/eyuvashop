'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { ExternalLink, Truck, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  packed: 'bg-purple-50 text-purple-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  refunded: 'bg-slate-200 text-slate-700',
};

interface Props {
  order: Order & { profile?: { first_name?: string; email: string }; items?: { title: string; quantity: number }[] };
}

export default function AdminOrderRow({ order }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      setStatus(newStatus as OrderStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Enter a tracking number');
      return;
    }
    setIsSavingTracking(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber.trim(), updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast.success('Tracking number saved');
      setShowTracking(false);
    } catch {
      toast.error('Failed to save tracking number');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const cancelOrder = async () => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      setStatus('cancelled');
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="px-5 py-4">
        <span className="font-semibold text-orange-600">#{order.order_number}</span>
      </td>
      <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">
        {order.profile?.first_name || order.profile?.email || 'Guest'}
      </td>
      <td className="px-5 py-4 text-slate-500 hidden md:table-cell">
        {(order.items || []).slice(0, 2).map((item, index) => (
          <span key={`${order.id}-item-${index}`} className="block">
            {item.title} x {item.quantity}
          </span>
        ))}
        {(order.items || []).length > 2 && (
          <span className="text-xs text-slate-400">+{(order.items || []).length - 2} more</span>
        )}
      </td>
      <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(order.total)}</td>
      <td className="px-5 py-4">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {order.payment_status.toUpperCase()}
        </span>
      </td>
      <td className="px-5 py-4">
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={isUpdating}
          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-white text-slate-800 font-normal">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-5 py-4 text-slate-500 text-xs hidden lg:table-cell">
        {formatDateTime(order.created_at)}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-orange-600"
            >
              <ExternalLink size={12} /> View
            </Link>
            <button
              onClick={() => setShowTracking((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-orange-600"
            >
              <Truck size={12} /> Tracking
            </button>
            <button
              onClick={cancelOrder}
              disabled={isCancelling}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
            >
              <XCircle size={12} /> {isCancelling ? 'Cancelling' : 'Cancel'}
            </button>
          </div>
          {showTracking && (
            <div className="flex items-center gap-2">
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking #"
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 w-36"
              />
              <button
                onClick={saveTracking}
                disabled={isSavingTracking}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600"
              >
                <Save size={12} /> {isSavingTracking ? 'Saving' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

