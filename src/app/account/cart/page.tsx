'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/hooks/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => { setMounted(true); }, []);

  // Sync cart item removal to Supabase
  const handleRemove = async (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    }
  };

  const handleUpdateQty = async (productId: string, qty: number, variantId?: string) => {
    updateQuantity(productId, qty, variantId);
    if (user && qty > 0) {
      await supabase
        .from('cart')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('product_id', productId);
    }
  };

  const totalPrice = mounted ? getTotalPrice() : 0;
  const totalItems = mounted ? items.length : 0;
  const shipping = totalPrice >= 999 ? 0 : 49;
  const grandTotal = totalPrice + shipping;

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Cart</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => { clearCart(); }}
            className="text-xs font-bold text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
          >
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse products and add them to your cart. Free shipping on orders above ₹999!"
            actionLabel="Start Shopping"
            actionHref="/"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const product = item.product;
                const image = (product as any).images?.find((i: any) => i.is_primary)?.url ||
                  (product as any).images?.[0]?.url;
                const itemTotal = product.price * item.quantity;

                return (
                  <div key={`${product.id}-${item.selectedVariantId}`} className="p-4 flex gap-4">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {image ? (
                        <Image src={image} alt={product.title} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-sm text-gray-900 hover:text-[#FF6B00] transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                      </Link>
                      {(product as any).store && (
                        <p className="text-xs text-gray-400 mt-0.5">{(product as any).store.name}</p>
                      )}

                      <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => handleUpdateQty(product.id, item.quantity - 1, item.selectedVariantId)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-[#FF6B00] shadow-sm"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(product.id, item.quantity + 1, item.selectedVariantId)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-[#FF6B00] shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-black text-gray-900">₹{itemTotal.toLocaleString('en-IN')}</p>
                          <button
                            onClick={() => handleRemove(product.id, item.selectedVariantId)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-extrabold text-gray-900">Order Summary</h2>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({totalItems} items)</span>
                <span className="font-semibold">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add ₹{(999 - totalPrice).toLocaleString('en-IN')} more for free shipping</p>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="font-extrabold text-gray-900">Total</span>
                <span className="font-black text-xl text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="block text-center text-xs font-semibold text-gray-400 hover:text-[#FF6B00] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
