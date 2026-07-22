import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Package, Truck, MapPin, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';

const ORDER_STEPS = [
  { status: 'pending', label: 'Order Placed', icon: '📋' },
  { status: 'confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'packed', label: 'Packed', icon: '📦' },
  { status: 'shipped', label: 'Shipped', icon: '🚚' },
  { status: 'delivered', label: 'Delivered', icon: '🏠' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, packed: 2, shipped: 3, delivered: 4,
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(title, images))')
    .eq('id', orderId)
    .single();

  if (!order) notFound();

  const currentStep = STATUS_INDEX[order.status] || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-500 text-sm mb-4">
            Thank you for your order. We&apos;ll send you updates via email.
          </p>
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            <span className="text-sm text-gray-600">Order Number:</span>
            <span className="text-base font-black text-orange-600">#{order.order_number}</span>
          </div>
        </div>

        {/* Order Tracker */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Truck size={18} className="text-orange-500" />
            Order Status
          </h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            {/* Steps */}
            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, i) => (
                <div key={step.status} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ${
                      i <= currentStep
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-[10px] font-semibold text-center ${i <= currentStep ? 'text-orange-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {order.tracking_number && (
            <div className="mt-6 bg-blue-50 rounded-xl p-3 text-sm">
              <p className="text-blue-700 font-semibold">
                Tracking Number: <span className="font-black">{order.tracking_number}</span>
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-orange-500" />
            Items Ordered ({order.items?.length || 0})
          </h2>
          <div className="space-y-3">
            {order.items?.map((item: Order['items'] extends (infer T)[] | undefined ? T : never) => (
              <div key={(item as {id: string}).id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image
                    src={(item as {image: string}).image || 'https://via.placeholder.com/56'}
                    alt={(item as {title: string}).title}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{(item as {title: string}).title}</p>
                  <p className="text-xs text-gray-500">Qty: {(item as {quantity: number}).quantity}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency((item as {price: number, quantity: number}).price * (item as {quantity: number}).quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Price Summary */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-green-600">Discount</span><span className="text-green-600">-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</span></div>
              <div className="border-t pt-2 flex justify-between font-black text-base">
                <span>Total Paid</span><span className="text-orange-500">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                Payment: {order.payment_status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1">
              <MapPin size={14} className="text-orange-500" /> Delivery Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{order.shipping_address?.full_name}</p>
              <p>{order.shipping_address?.line1}</p>
              {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} – {order.shipping_address?.pincode}</p>
              <p className="text-gray-500">📞 {order.shipping_address?.phone}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {user && (
            <Link
              href="/account/orders"
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-colors"
            >
              View My Orders
            </Link>
          )}
          <Link
            href="/shop"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3.5 rounded-2xl transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
