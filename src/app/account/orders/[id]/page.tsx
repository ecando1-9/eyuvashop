import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Package, MapPin, CreditCard, Truck, CheckCircle2, Circle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';

const ORDER_STEPS = [
  { status: 'pending', label: 'Order Placed', sub: 'Your order has been placed' },
  { status: 'confirmed', label: 'Confirmed', sub: 'Order confirmed by seller' },
  { status: 'packed', label: 'Packed', sub: 'Item packed and ready' },
  { status: 'shipped', label: 'Shipped', sub: 'On its way to you' },
  { status: 'delivered', label: 'Delivered', sub: 'Delivered successfully' },
];
const STATUS_INDEX: Record<string, number> = { pending: 0, confirmed: 1, packed: 2, shipped: 3, delivered: 4 };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!order) notFound();

  const currentStep = STATUS_INDEX[order.status] || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-sm text-gray-500 hover:text-orange-500">← Back</Link>
        <h1 className="text-xl font-black text-gray-900">Order #{order.order_number}</h1>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Truck size={16} className="text-orange-500" /> Tracking
        </h2>
        <div className="space-y-0">
          {ORDER_STEPS.map((step, i) => {
            const isCompleted = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : <Circle size={16} className="text-gray-300" />}
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-0.5 ${isCompleted ? 'bg-orange-300' : 'bg-gray-100'}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  <p className={`text-xs ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>{step.sub}</p>
                  {isCurrent && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                      CURRENT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {order.tracking_number && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
            Tracking Number: <strong className="text-gray-900">{order.tracking_number}</strong>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package size={16} className="text-orange-500" /> Items ({order.items?.length || 0})
        </h2>
        <div className="space-y-3">
          {order.items?.map((item: Record<string, unknown>) => (
            <div key={item.id as string} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <Image src={(item.image as string) || 'https://via.placeholder.com/56'} alt={item.title as string} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title as string}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.price as number)} × {item.quantity as number}
                  {item.size ? ` · ${item.size}` : ''}
                  {item.color ? ` · ${item.color}` : ''}
                </p>
              </div>
              <span className="text-sm font-bold">{formatCurrency((item.price as number) * (item.quantity as number))}</span>
            </div>
          ))}
        </div>

        {/* Price Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</span></div>
          <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
            <span>Total</span><span className="text-orange-500">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1"><MapPin size={14} className="text-orange-500" />Delivery Address</h3>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-900">{order.shipping_address?.full_name}</p>
            <p>{order.shipping_address?.line1}</p>
            {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
            <p>{order.shipping_address?.city}, {order.shipping_address?.state} – {order.shipping_address?.pincode}</p>
            <p className="text-gray-500">{order.shipping_address?.phone}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1"><CreditCard size={14} className="text-orange-500" />Payment Info</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {order.payment_status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Order Placed</span><span className="font-medium">{formatDateTime(order.created_at)}</span></div>
            {order.payment_id && <div className="flex justify-between"><span className="text-gray-500">Payment ID</span><span className="text-xs font-mono text-gray-600 truncate max-w-32">{order.payment_id}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
