'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WishlistStore {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncFromSupabase: (userId: string) => Promise<void>;
  _setItems: (items: Product[]) => void;
}

const supabase = createClient();

const addToSupabase = async (userId: string, productId: string) => {
  if (!userId) return;
  await supabase.from('wishlist').upsert(
    { user_id: userId, product_id: productId },
    { onConflict: 'user_id,product_id' }
  );
};

const removeFromSupabase = async (userId: string, productId: string) => {
  if (!userId) return;
  await supabase.from('wishlist').delete().eq('user_id', userId).eq('product_id', productId);
};

const clearFromSupabase = async (userId: string) => {
  if (!userId) return;
  await supabase.from('wishlist').delete().eq('user_id', userId);
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: async (product) => {
        const currentItems = get().items;
        const exists = currentItems.some((item) => item.id === product.id);
        
        if (exists) {
          set({ items: currentItems.filter((item) => item.id !== product.id) });
        } else {
          set({ items: [...currentItems, product] });
        }
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          if (exists) {
            removeFromSupabase(authData.user.id, product.id).catch(console.error);
          } else {
            addToSupabase(authData.user.id, product.id).catch(console.error);
          }
        }
      },
      isInWishlist: (productId) => get().items.some((item) => item.id === productId),
      clearWishlist: async () => {
        set({ items: [] });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          clearFromSupabase(authData.user.id).catch(console.error);
        }
      },
      _setItems: (items) => set({ items }),
      syncFromSupabase: async (userId: string) => {
        try {
          const { data: wishlistData, error } = await supabase
            .from('wishlist')
            .select('product:products(*)')
            .eq('user_id', userId);
            
          if (error) throw error;
          
          if (wishlistData) {
            const mappedItems: Product[] = wishlistData
              .filter(item => item.product) // Filter out deleted products
              .map(item => item.product as unknown as Product);
              
            get()._setItems(mappedItems);
          }
        } catch (error) {
          console.error("Failed to sync wishlist from Supabase:", error);
        }
      },
    }),
    {
      name: 'eyuvashop-wishlist-storage',
    }
  )
);

export function useSyncWishlist() {
  const { user } = useAuth();
  const syncFromSupabase = useWishlistStore(state => state.syncFromSupabase);
  
  useEffect(() => {
    if (user?.id) {
      syncFromSupabase(user.id);
    }
  }, [user?.id, syncFromSupabase]);
}
