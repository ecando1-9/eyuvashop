'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

// Assuming a basic store interface
interface CartItem {
  id: string; // cart item id or local id
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: any; // The joined product data
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('cart')
          .select('*, product:products(*, images:product_images(*), store:stores(name))')
          .eq('user_id', user.id);

        if (error) throw error;
        setCartItems(data || []);
      } else {
        // Fallback to local storage or Zustand if implemented
        // const localCart = useCartStore.getState().items;
        // setCartItems(localCart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Update local state optimistically
    setCartItems(items => 
      items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item)
    );

    if (user) {
      await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      // Update local store
    }
  };

  const removeItem = async (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      // Update local store
    }
  };

  const saveForLater = async (item: CartItem) => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    try {
      // Move to wishlist
      await supabase.from('wishlist').insert({
        user_id: user.id,
        product_id: item.product_id,
      });
      // Remove from cart
      await removeItem(item.id);
    } catch (error) {
      console.error('Error saving for later:', error);
    }
  };

  const applyCoupon = async () => {
    // Dummy implementation for coupon logic
    if (couponCode === 'SAVE100') {
      setDiscount(100);
    } else {
      alert('Invalid coupon code');
    }
  };

  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);

  const shipping = subtotal > 999 ? 0 : (subtotal > 0 ? 49 : 0);
  const total = subtotal + shipping - discount;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="w-full lg:w-96 h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <EmptyState
          icon="inbox"
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#0B1E3D]">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            const primaryImage = product?.images?.find((img: any) => img.is_primary)?.url || product?.images?.[0]?.url;
            const isOutOfStock = product?.stock_quantity < item.quantity;
            const isNotPublished = product?.status !== 'published';

            return (
              <div key={item.id} className="flex flex-col sm:flex-row bg-white border rounded-lg p-4 gap-4 shadow-sm relative">
                {(isOutOfStock || isNotPublished) && (
                  <div className="absolute top-0 left-0 w-full h-full bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                      {isNotPublished ? 'Product unavailable' : 'Out of stock'}
                    </span>
                  </div>
                )}
                
                <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {primaryImage ? (
                    <Image src={primaryImage} alt={product?.title || 'Product'} width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag /></div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{product?.title}</h3>
                    <p className="text-sm text-gray-500">{product?.store?.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[#FF6B00]">{formatCurrency(product?.price || 0)}</span>
                      {product?.compare_at_price > product?.price && (
                        <span className="text-sm text-gray-400 line-through">{formatCurrency(product?.compare_at_price)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-1 font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        disabled={product?.stock_quantity <= item.quantity}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => saveForLater(item)}
                        className="text-sm text-gray-500 hover:text-[#0B1E3D] flex items-center gap-1"
                      >
                        <Heart className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
                      </button>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 ml-4"
                      >
                        <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="bg-white border rounded-lg p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-[#0B1E3D]">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code" 
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
                <button 
                  onClick={applyCoupon}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Apply
                </button>
              </div>
            </div>

            <button 
              onClick={() => router.push('/checkout')}
              className="w-full bg-[#FF6B00] hover:bg-[#e66000] text-white font-medium py-3 rounded-md flex justify-center items-center gap-2 transition-colors"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 text-xs text-center text-gray-500">
              <p>Free shipping on orders above {formatCurrency(999)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
