'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, MapPin, CreditCard, ShoppingBag, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/hooks/useCartStore';




interface CheckoutAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  area?: string | null;
  city: string;
  state: string;
  postal_code: string;
  address_type: string;
}

interface CheckoutCartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  product?: {
    id: string;
    title: string;
    price: number;
    store_id: string;
    images?: { url: string }[];
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const syncCartFromSupabase = useCartStore((state) => state.syncFromSupabase);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [newAddress, setNewAddress] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '', 
    area: '', landmark: '', city: '', state: '', postal_code: '', address_type: 'home'
  });

  const fetchCheckoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch addresses
      const { data: addrs } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });
      
      setAddresses(addrs || []);
      if (addrs && addrs.length > 0) {
        setSelectedAddressId(addrs[0].id);
      } else {
        setShowNewAddressForm(true);
      }

      if (user?.id) {
        await syncCartFromSupabase(user.id);
      }

      // Fetch cart and actual product prices
      const { data: cartData } = await supabase
        .from('cart')
        .select('*, product:products(id, title, price, store_id, images:product_images(url))')
        .eq('user_id', user?.id);
      
      if (!cartData || cartData.length === 0) {
        const localCartItems = useCartStore.getState().items;
        if (localCartItems.length > 0) {
          setCartItems(
            localCartItems.map((item) => ({
              id: `${item.product.id}-${item.selectedVariantId || 'default'}`,
              product_id: item.product.id,
              variant_id: item.selectedVariantId || null,
              quantity: item.quantity,
              product: {
                id: item.product.id,
                title: item.product.title,
                price: item.product.price,
                store_id: item.product.store_id,
                images: item.product.images?.map((image) => ({ url: image.url })) || [],
              },
            }))
          );
          return;
        }

        router.push('/cart');
        return;
      }
      
      setCartItems(cartData);
    } catch (error) {
      console.error('Error fetching checkout data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase, syncCartFromSupabase, user?.id]);

  useEffect(() => {
    if (user === null) {
      router.push('/login?redirect=/checkout');
    } else if (user) {
      fetchCheckoutData();
    }
  }, [fetchCheckoutData, user, router]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...newAddress,
          user_id: user?.id,
          is_default: addresses.length === 0
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setAddresses([data, ...addresses]);
      setSelectedAddressId(data.id);
      setShowNewAddressForm(false);
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      // Get complete address details for snapshot
      const address = addresses.find(a => a.id === selectedAddressId);
      if (!address) throw new Error('No address selected');
      
      // We will call the RPC here
      // For now, construct the required items array
      const items = cartItems.map(item => ({
        store_id: item.product?.store_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.product?.price || 0 // Validated from DB query
      }));
      
      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_user_id: user?.id,
        p_address_id: address.id,
        p_payment_method: 'COD',
        p_items: items
      });
      
      if (error) throw error;
      
      setOrderId(data);
      setStep(4);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        
        <main className="flex-grow container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        </main>
        
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-[#0B1E3D]">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center mb-8 px-4">
        {[
          { num: 1, label: 'Address', icon: MapPin },
          { num: 2, label: 'Review', icon: ShoppingBag },
          { num: 3, label: 'Payment', icon: CreditCard },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex flex-col items-center ${step >= s.num ? 'text-[#FF6B00]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= s.num ? 'border-[#FF6B00] bg-orange-50' : 'border-gray-300'}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium mt-2 hidden sm:block">{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`w-12 sm:w-24 h-1 mx-2 sm:mx-4 ${step > s.num ? 'bg-[#FF6B00]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Select Delivery Address</h2>
              
              {!showNewAddressForm ? (
                <div className="space-y-4">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-[#FF6B00] bg-orange-50' : 'hover:border-gray-400'}`}>
                      <input 
                        type="radio" 
                        name="address" 
                        className="mt-1 mr-3 text-[#FF6B00] focus:ring-[#FF6B00]" 
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div>
                        <div className="font-medium">{addr.full_name} <span className="text-xs ml-2 bg-gray-200 px-2 py-0.5 rounded text-gray-700 uppercase">{addr.address_type}</span></div>
                        <p className="text-sm text-gray-600 mt-1">{addr.address_line1}, {addr.address_line2 && `${addr.address_line2},`} {addr.area}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.postal_code}</p>
                        <p className="text-sm text-gray-600 mt-1">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  
                  <button 
                    onClick={() => setShowNewAddressForm(true)}
                    className="flex items-center text-[#FF6B00] font-medium py-2 hover:underline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add New Address
                  </button>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!selectedAddressId}
                      className="bg-[#0B1E3D] hover:bg-[#1a3668] text-white px-8 py-2.5 rounded-md font-medium disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input required type="text" value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input required type="text" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                      <input required type="text" value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                      <input type="text" value={newAddress.address_line2} onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality</label>
                      <input required type="text" value={newAddress.area} onChange={e => setNewAddress({...newAddress, area: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input required type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input required type="text" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input required type="text" value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                      <select value={newAddress.address_type} onChange={e => setNewAddress({...newAddress, address_type: e.target.value})} className="w-full border p-2 rounded">
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setShowNewAddressForm(false)} className="px-6 py-2 border rounded-md font-medium text-gray-700">Cancel</button>
                    )}
                    <button type="submit" disabled={isSubmitting} className="bg-[#FF6B00] hover:bg-[#e66000] text-white px-6 py-2 rounded-md font-medium">
                      {isSubmitting ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Step 2: Review Order */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Review Your Order</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0]?.url && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product?.title || 'Product'}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-1">{item.product?.title}</h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium">
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-md font-medium text-gray-700">Back</button>
                <button onClick={() => setStep(3)} className="bg-[#0B1E3D] hover:bg-[#1a3668] text-white px-8 py-2.5 rounded-md font-medium">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Payment Method</h2>
              
              <div className="space-y-4">
                <label className="flex items-center p-4 border rounded-lg border-[#FF6B00] bg-orange-50 cursor-pointer">
                  <input type="radio" name="payment" className="mr-3 text-[#FF6B00] focus:ring-[#FF6B00]" checked readOnly />
                  <div className="font-medium">Cash on Delivery (COD)</div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg opacity-60 cursor-not-allowed">
                  <input type="radio" name="payment" className="mr-3" disabled />
                  <div>
                    <div className="font-medium text-gray-500">Online Payment</div>
                    <div className="text-xs text-gray-400">Coming Soon - Razorpay Integration Pending</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(2)} className="px-6 py-2 border rounded-md font-medium text-gray-700">Back</button>
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={isSubmitting}
                  className="bg-[#FF6B00] hover:bg-[#e66000] text-white px-8 py-2.5 rounded-md font-bold text-lg flex items-center justify-center min-w-[200px]"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-[#0B1E3D] mb-2">Order Confirmed!</h2>
              <p className="text-gray-600 mb-6">Thank you for shopping with eYuvashop.</p>
              
              <div className="bg-gray-50 p-6 rounded-lg inline-block text-left mb-8">
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="font-bold text-lg mb-4">{orderId || '#ORD-XXXXXX'}</p>
                <p className="text-sm text-gray-500 mb-1">Amount Paid (COD)</p>
                <p className="font-bold text-lg">{formatCurrency(total)}</p>
              </div>
              
              <div>
                <Link href={`/account/orders`} className="inline-block bg-[#0B1E3D] text-white px-8 py-3 rounded-md font-medium hover:bg-[#1a3668] transition-colors">
                  View Order Details
                </Link>
                <div className="mt-4">
                  <Link href="/products" className="text-[#FF6B00] font-medium hover:underline">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        {step < 4 && (
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4 text-[#0B1E3D]">Price Details</h3>
              <div className="space-y-3 pb-4 border-b text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Price ({cartItems.length} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatCurrency(shipping)}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4">
                <span>Total Amount</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      </main>

      
      
    </div>
  );
}
