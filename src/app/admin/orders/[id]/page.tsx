import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, profile:profiles(first_name, email, phone), items:order_items(title, quantity, price)')
    .eq('id', params.id)
    .single();

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/admin/orders" className="text-sm text-orange-600">Back to Orders</Link>
        <p className="text-slate-500">Order not found.</p>
      </div>
    );
  }

  const address = order.shipping_address as {
    full_name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Order Details</p>
          <h1 className="text-2xl font-semibold text-slate-900">#{order.order_number}</h1>
          <p className="text-sm text-slate-500">Placed on {formatDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Items</h2>
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900">Payment</h3>
            </div>
            <p className="text-sm text-slate-600">Status: <span className="font-semibold">{order.payment_status}</span></p>
            <p className="text-sm text-slate-600">Payment ID: <span className="font-semibold">{order.payment_id || '-'}</span></p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900">Shipping</h3>
            </div>
            <p className="text-sm text-slate-600">Status: <span className="font-semibold">{order.status}</span></p>
            <p className="text-sm text-slate-600">Tracking: <span className="font-semibold">{order.tracking_number || '-'}</span></p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900">Totals</h3>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Customer</h3>
          <p className="text-sm text-slate-600">{order.profile?.first_name || 'Guest'}</p>
          <p className="text-sm text-slate-600">{order.profile?.email || '-'}</p>
          <p className="text-sm text-slate-600">{order.profile?.phone || '-'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Shipping Address</h3>
          {address ? (
            <div className="text-sm text-slate-600 space-y-1">
              <p>{address.full_name}</p>
              <p>{address.phone}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state} {address.pincode}</p>
              <p>{address.country}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No address found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

