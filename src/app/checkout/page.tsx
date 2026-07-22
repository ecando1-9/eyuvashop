'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MapPin,
  Plus,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Address } from '@/types';
import toast from 'react-hot-toast';

type Step = 'address' | 'review' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    label: 'Home',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 499 ? 0 : 79;
  const total = subtotal + shipping;

  useEffect(() => {
    const fetchAddresses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=/checkout'); return; }
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (data && data.length > 0) {
        setAddresses(data as Address[]);
        const def = data.find((a) => a.is_default) || data[0];
        setSelectedAddressId(def.id);
      } else {
        setShowAddressForm(true);
      }
    };
    fetchAddresses();
  }, []);

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...newAddress, user_id: user.id, is_default: addresses.length === 0 })
        .select()
        .single();
      if (error) throw error;
      setAddresses((prev) => [...prev, data as Address]);
      setSelectedAddressId(data.id);
      setShowAddressForm(false);
      toast.success('Address saved!');
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }
    setIsProcessing(true);

    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) throw new Error('Address not found');

      // Create order in DB first
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            title: i.product?.title,
            image: i.product?.images?.[0],
            price: i.product?.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          subtotal,
          shipping,
          total,
          shipping_address: selectedAddress,
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) throw new Error(orderData.error);

      // Load Razorpay
      await loadRazorpay();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.razorpayOrder.amount,
        currency: 'INR',
        name: 'eYuvaShop',
        description: `Order #${orderData.orderNumber}`,
        order_id: orderData.razorpayOrder.id,
        prefill: {
          name: selectedAddress.full_name,
          contact: selectedAddress.phone,
        },
        theme: { color: '#f97316' },
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            clearCart();
            router.push(`/order-confirmation/${orderData.orderId}`);
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-black text-gray-900">Checkout</h1>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Lock size={12} className="text-green-500" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(['address', 'review', 'payment'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                step === s ? 'text-orange-600' : step > s ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step === s ? 'bg-orange-500 text-white' :
                  ['address','review','payment'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {['address','review','payment'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                <span className="capitalize hidden sm:block">{s}</span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Step: Address */}
            {step === 'address' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" />
                  Delivery Address
                </h2>

                {/* Saved Addresses */}
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${
                      selectedAddressId === addr.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-800">{addr.full_name}</p>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {addr.line1}, {addr.line2 ? addr.line2 + ', ' : ''}{addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}

                {/* Add new address */}
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 mt-2"
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                )}

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Full Name *</label>
                        <input required value={newAddress.full_name} onChange={(e) => setNewAddress((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Phone *</label>
                        <input required value={newAddress.phone} onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Address Line 1 *</label>
                      <input required value={newAddress.line1} onChange={(e) => setNewAddress((p) => ({ ...p, line1: e.target.value }))} className="mt-1" placeholder="House/Flat No., Street Name" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Address Line 2</label>
                      <input value={newAddress.line2} onChange={(e) => setNewAddress((p) => ({ ...p, line2: e.target.value }))} className="mt-1" placeholder="Area, Locality (optional)" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700">City *</label>
                        <input required value={newAddress.city} onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">State *</label>
                        <input required value={newAddress.state} onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Pincode *</label>
                        <input required value={newAddress.pincode} onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Label</label>
                      <div className="flex gap-2 mt-1">
                        {['Home', 'Work', 'Other'].map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setNewAddress((p) => ({ ...p, label: l }))}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-colors ${
                              newAddress.label === l ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-orange-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {selectedAddressId && !showAddressForm && (
                  <button
                    onClick={() => setStep('review')}
                    className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Review <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Step: Review */}
            {step === 'review' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Review Your Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/56'}
                          alt={item.product?.title || ''}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product?.title}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                          {item.size && ` · Size: ${item.size}`}
                          {item.color && ` · ${item.color}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery address preview */}
                {selectedAddress && (
                  <div className="border border-orange-100 rounded-xl p-3 bg-orange-50 mb-5">
                    <p className="text-xs font-bold text-orange-700 mb-1">Delivering to:</p>
                    <p className="text-xs text-gray-700">
                      {selectedAddress.full_name} · {selectedAddress.phone}<br />
                      {selectedAddress.line1}, {selectedAddress.line2 ? selectedAddress.line2 + ', ' : ''}
                      {selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}
                    </p>
                    <button onClick={() => setStep('address')} className="text-[11px] text-orange-600 font-semibold mt-1 hover:text-orange-800">
                      Change
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep('address')} className="flex-1 border border-gray-200 text-sm font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep('payment')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Proceed to Pay <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {step === 'payment' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-orange-500" />
                  Payment
                </h2>

                <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle2 size={16} />
                    Secured by Razorpay
                  </div>
                  <p className="text-xs">Pay via UPI, Credit Card, Debit Card, Net Banking, EMI & Wallets. 100% safe & encrypted.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('review')} className="flex-1 border border-gray-200 text-sm font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>Pay {formatCurrency(total)} <Lock size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="line-clamp-1 flex-1 mr-2">{item.product?.title} ×{item.quantity}</span>
                    <span className="flex-shrink-0 font-medium">{formatCurrency((item.product?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-base">
                  <span>Total</span>
                  <span className="text-orange-500">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
