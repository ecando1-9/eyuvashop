'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariantId?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
  syncFromSupabase: (userId: string) => Promise<void>;
  _setItems: (items: CartItem[]) => void;
}

const supabase = createClient();

// Helper to interact with Supabase silently
const syncItemToSupabase = async (userId: string, productId: string, variantId: string | null | undefined, quantity: number) => {
  if (!userId) return;
  await supabase.from('cart').upsert(
    { user_id: userId, product_id: productId, variant_id: variantId || null, quantity },
    { onConflict: 'user_id,product_id,variant_id' }
  );
};

const deleteItemFromSupabase = async (userId: string, productId: string, variantId: string | null | undefined) => {
  if (!userId) return;
  let query = supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId);
  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }
  await query;
};

const clearCartFromSupabase = async (userId: string) => {
  if (!userId) return;
  await supabase.from('cart').delete().eq('user_id', userId);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (product, quantity = 1, variantId) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (item) => item.product.id === product.id && item.selectedVariantId === variantId
        );

        let newQuantity = quantity;
        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex].quantity += quantity;
          newQuantity = updatedItems[existingIndex].quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { product, quantity, selectedVariantId: variantId }] });
        }
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          syncItemToSupabase(authData.user.id, product.id, variantId, newQuantity).catch(console.error);
        }
      },
      removeItem: async (productId, variantId) => {
        set({
          items: get().items.filter(
            (item) => !(item.product.id === productId && item.selectedVariantId === variantId)
          ),
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          deleteItemFromSupabase(authData.user.id, productId, variantId).catch(console.error);
        }
      },
      updateQuantity: async (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.selectedVariantId === variantId
              ? { ...item, quantity }
              : item
          ),
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          syncItemToSupabase(authData.user.id, productId, variantId, quantity).catch(console.error);
        }
      },
      clearCart: async () => {
        set({ items: [] });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          clearCartFromSupabase(authData.user.id).catch(console.error);
        }
      },
      getTotalCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
      _setItems: (items) => set({ items }),
      syncFromSupabase: async (userId: string) => {
        try {
          const { data: cartData, error } = await supabase
            .from('cart')
            .select('quantity, variant_id, product:products(*)')
            .eq('user_id', userId);
            
          if (error) throw error;
          
          if (cartData) {
            const mappedItems: CartItem[] = cartData
              .filter(item => item.product) // Filter out deleted products
              .map(item => ({
                product: item.product as unknown as Product,
                quantity: item.quantity,
                selectedVariantId: item.variant_id || undefined
              }));
              
            get()._setItems(mappedItems);
          }
        } catch (error) {
          console.error("Failed to sync cart from Supabase:", error);
        }
      },
    }),
    {
      name: 'eyuvashop-cart-storage',
    }
  )
);

export function useSyncCart() {
  const { user } = useAuth();
  const syncFromSupabase = useCartStore(state => state.syncFromSupabase);
  
  useEffect(() => {
    if (user?.id) {
      syncFromSupabase(user.id);
    }
  }, [user?.id, syncFromSupabase]);
}
