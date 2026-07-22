'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Trash2, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 499 ? 0 : 79;
  const total = subtotal - discount + shipping;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscount(data.discount);
        setCouponApplied(couponCode);
        toast.success(`Coupon applied! You save ${formatCurrency(data.discount)}`);
      } else {
        toast.error(data.error || 'Invalid coupon code');
      }
    } catch {
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponApplied('');
    setCouponCode('');
    toast.success('Coupon removed');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={36} className="text-orange-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          Looks like you haven&apos;t added anything yet. Start shopping to fill your cart!
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-200"
        >
          <ShoppingBag size={18} />
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-8">
          Shopping Cart
          <span className="text-base font-normal text-gray-500 ml-2">({items.length} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 animate-fade-in"
              >
                {/* Product Image */}
                <Link href={`/product/${item.product?.slug}`} className="flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50">
                    <Image
                      src={item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                      alt={item.product?.title || 'Product'}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product?.slug}`}>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-orange-600 transition-colors mb-1">
                      {item.product?.title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.size && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Color: {item.color}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Price */}
                    <div>
                      <span className="font-bold text-gray-900">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({formatCurrency(item.product?.price || 0)} each)
                        </span>
                      )}
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.size, item.color)}
                        className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.size, item.color)}
                        className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => {
                          removeItem(item.product_id, item.size, item.color);
                          toast.success('Item removed');
                        }}
                        className="w-7 h-7 ml-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <button
              onClick={() => { clearCart(); toast.success('Cart cleared'); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium ml-2"
            >
              Clear all items
            </button>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon Code */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Tag size={15} className="text-orange-500" />
                Coupon Code
              </h3>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-green-700">{couponApplied}</p>
                    <p className="text-xs text-green-600">Saving {formatCurrency(discount)}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-red-500 font-semibold hover:text-red-700">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-400"
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                    className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                    {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-orange-500">
                    Add {formatCurrency(499 - subtotal)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-base">
                  <span>Total</span>
                  <span className="text-orange-500">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02] shadow-md shadow-orange-200"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Link>

              <Link
                href="/shop"
                className="mt-3 w-full flex items-center justify-center text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="bg-orange-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-orange-700 font-semibold flex items-center gap-1">🔒 Safe & Secure Checkout</p>
              <p className="text-xs text-gray-600">Payments powered by Razorpay. Your payment info is protected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
