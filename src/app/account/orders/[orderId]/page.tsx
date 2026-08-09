'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Package, MapPin, CreditCard, CheckCircle2,
  Circle, Clock, Truck, Home, X, RotateCcw, Headphones,
  RefreshCw, ShoppingBag, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SkeletonCard, SkeletonLine } from '@/components/account/SkeletonLoader';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  created_at: string;
  updated_at: string;
  address_snapshot?: Record<string, string>;
  address?: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    area?: string;
    landmark?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
    product: {
      id: string;
      title: string;
      price: number;
      images?: { url: string; is_primary: boolean }[];
    };
    variant?: { name: string; attributes: Record<string, string> };
    store: { name: string };
  }[];
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

function getStepStatus(stepKey: string, orderStatus: string): 'done' | 'active' | 'upcoming' {
  if (orderStatus === 'cancelled' || orderStatus === 'refunded') return 'upcoming';
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const orderIdx = STATUS_ORDER.indexOf(orderStatus);
  if (stepIdx < orderIdx) return 'done';
  if (stepIdx === orderIdx) return 'active';
  return 'upcoming';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  shipped: { label: 'Shipped', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  refunded: { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id, order_number, status, payment_status, payment_method,
            total_amount, subtotal, shipping_fee, discount,
            created_at, updated_at, address_snapshot,
            address:addresses(full_name, phone, address_line1, address_line2, area, landmark, city, state, postal_code),
            order_items(
              id, quantity, unit_price, total_price, status,
              product:products(id, title, price, images:product_images(url, is_primary)),
              variant:product_variants(name, attributes),
              store:stores(name)
            )
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Order not found');
        setOrder(data as unknown as OrderDetail);
      } catch {
        setError('Order not found or you do not have access to this order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, orderId]);

  const handleCancel = async () => {
    if (!order || !user) return;
    try {
      setCancelling(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      setOrder((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
      setShowCancelModal(false);
    } catch {
      alert('Failed to cancel the order. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order && ['pending', 'processing'].includes(order.status);
  const canReturn = order && order.status === 'delivered';

  const deliveryAddress = order?.address_snapshot
    ? order.address_snapshot
    : order?.address;

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">{error || 'This order does not exist or you don\'t have access.'}</p>
        <Link href="/account/orders" className="bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-xl text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-5">
      {/* Back Navigation */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF6B00] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Order Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-extrabold text-gray-900">#{order.order_number}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
            <p className={`text-xs font-semibold mt-0.5 ${
              order.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'
            }`}>
              {order.payment_status === 'paid' ? '✓ Payment Confirmed' :
               order.payment_status === 'refunded' ? '↩ Refunded' : '⚠ Payment Pending'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel Order
            </button>
          )}
          {canReturn && (
            <Link
              href={`/account/returns?order=${order.id}`}
              className="flex items-center gap-1.5 border border-orange-200 text-[#FF6B00] hover:bg-orange-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return / Refund
            </Link>
          )}
          <Link
            href="/account/support"
            className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Headphones className="w-3.5 h-3.5" /> Contact Support
          </Link>
        </div>
      </div>

      {/* Order Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" id="timeline">
          <h2 className="font-extrabold text-gray-900 text-sm mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6B00]" /> Order Timeline
          </h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
            <div className="space-y-6">
              {TIMELINE_STEPS.map((step) => {
                const stepStatus = getStepStatus(step.key, order.status);
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-4 relative">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      stepStatus === 'done' ? 'bg-green-500 text-white shadow-sm' :
                      stepStatus === 'active' ? 'bg-[#FF6B00] text-white shadow-md ring-4 ring-orange-100' :
                      'bg-gray-100 text-gray-300'
                    }`}>
                      {stepStatus === 'done' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : stepStatus === 'active' ? (
                        <Icon className="w-4.5 h-4.5" />
                      ) : (
                        <Circle className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${
                        stepStatus === 'upcoming' ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {step.label}
                      </p>
                      {stepStatus === 'active' && (
                        <p className="text-xs text-[#FF6B00] font-semibold">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled State */}
      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-700">Order Cancelled</p>
            <p className="text-xs text-red-500 mt-0.5">This order was cancelled. Refund will be processed if payment was made.</p>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#FF6B00]" /> Order Items ({order.order_items.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.order_items.map((item) => {
            const image = item.product.images?.find((i) => i.is_primary)?.url || item.product.images?.[0]?.url;
            return (
              <div key={item.id} className="p-5 flex gap-4">
                <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {image ? (
                    <Image src={image} alt={item.product.title} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-bold text-sm text-gray-900 hover:text-[#FF6B00] transition-colors line-clamp-2">
                      {item.product.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">Sold by {item.store.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Variant: {Object.entries(item.variant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}</p>
                    <p className="font-extrabold text-gray-900">₹{item.total_price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Address */}
      {deliveryAddress && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF6B00]" /> Delivery Address
          </h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-900">{deliveryAddress.full_name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {deliveryAddress.address_line1}
              {deliveryAddress.address_line2 && `, ${deliveryAddress.address_line2}`}
              {(deliveryAddress as any).area && `, ${(deliveryAddress as any).area}`}
            </p>
            {(deliveryAddress as any).landmark && (
              <p className="text-sm text-gray-400">Near {(deliveryAddress as any).landmark}</p>
            )}
            <p className="text-sm text-gray-600">
              {deliveryAddress.city}, {deliveryAddress.state} — {deliveryAddress.postal_code}
            </p>
            <p className="text-sm text-gray-600 mt-1">📞 {deliveryAddress.phone}</p>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#FF6B00]" /> Price Summary
        </h2>
        <div className="space-y-2.5">
          {[
            { label: 'Subtotal', value: `₹${order.subtotal.toLocaleString('en-IN')}` },
            { label: 'Shipping', value: order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee.toLocaleString('en-IN')}` },
            ...(order.discount > 0 ? [{ label: 'Discount', value: `-₹${order.discount.toLocaleString('en-IN')}` }] : []),
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className={`font-semibold ${row.value.startsWith('-') ? 'text-green-600' : 'text-gray-900'}`}>
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="font-extrabold text-gray-900">Total Paid</span>
            <span className="font-black text-xl text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
          </div>
          {order.payment_method && (
            <p className="text-xs text-gray-400 text-right">via {order.payment_method}</p>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="font-extrabold text-gray-900">Cancel Order?</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel order <span className="font-bold text-gray-900">#{order.order_number}</span>?
              This action cannot be undone. If payment was made, a refund will be initiated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
