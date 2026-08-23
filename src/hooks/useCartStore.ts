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

export interface AddToCartResult {
  success: boolean;
  message?: string;
  available?: number;
  inCart?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variantId?: string) => Promise<AddToCartResult>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
  syncFromSupabase: (userId: string) => Promise<void>;
  _setItems: (items: CartItem[]) => void;
}

const supabase = createClient();
const syncedUsers = new Set<string>();

const variantMatches = (left?: string | null, right?: string | null) =>
  (left || null) === (right || null);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error) {
    const maybeMessage = 'message' in error ? String(error.message) : '';
    const maybeDetails = 'details' in error ? String(error.details) : '';
    return maybeMessage || maybeDetails || JSON.stringify(error);
  }
  return String(error);
};

const logCartSyncNotice = (action: string) => (error: unknown) => {
  console.warn(`Cart ${action} saved locally; Supabase sync skipped:`, getErrorMessage(error));
};

const mergeCartItems = (
  localItems: CartItem[],
  remoteItems: CartItem[],
  quantityMode: 'add' | 'prefer-local' = 'prefer-local'
) => {
  const merged: CartItem[] = [];

  remoteItems.forEach((remoteItem) => {
    const existingIndex = merged.findIndex(
      (item) =>
        item.product.id === remoteItem.product.id &&
        variantMatches(item.selectedVariantId, remoteItem.selectedVariantId)
    );

    if (existingIndex > -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + remoteItem.quantity,
      };
    } else {
      merged.push(remoteItem);
    }
  });

  localItems.forEach((localItem) => {
    const existingIndex = merged.findIndex(
      (item) =>
        item.product.id === localItem.product.id &&
        variantMatches(item.selectedVariantId, localItem.selectedVariantId)
    );

    if (existingIndex > -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        product: { ...merged[existingIndex].product, ...localItem.product },
        quantity:
          quantityMode === 'add'
            ? merged[existingIndex].quantity + localItem.quantity
            : localItem.quantity,
      };
    } else {
      merged.push(localItem);
    }
  });

  return merged;
};

// Helper to interact with Supabase silently
const syncItemToSupabase = async (userId: string, productId: string, variantId: string | null | undefined, quantity: number) => {
  if (!userId) return;

  let query = supabase
    .from('cart')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId);

  query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);

  const { data: existingRows, error: selectError } = await query.limit(10);
  if (selectError) throw selectError;

  const existing = existingRows?.[0];

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('cart')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from('cart').insert({
    user_id: userId,
    product_id: productId,
    variant_id: variantId || null,
    quantity,
  });

  if (insertError) throw insertError;
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
          (item) => item.product.id === product.id && variantMatches(item.selectedVariantId, variantId)
        );
        const currentQuantity = existingIndex > -1 ? currentItems[existingIndex].quantity : 0;
        const stockQuantity = typeof product.stock_quantity === 'number' ? product.stock_quantity : undefined;

        if (stockQuantity !== undefined && stockQuantity <= 0) {
          return {
            success: false,
            message: 'Out of stock',
            available: 0,
            inCart: currentQuantity,
          };
        }

        if (stockQuantity !== undefined && currentQuantity + quantity > stockQuantity) {
          const available = Math.max(stockQuantity - currentQuantity, 0);

          return {
            success: false,
            message: available > 0 ? `Only ${available} more available` : 'Out of stock',
            available,
            inCart: currentQuantity,
          };
        }

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
          syncItemToSupabase(authData.user.id, product.id, variantId, newQuantity).catch(logCartSyncNotice('item'));
        }

        return {
          success: true,
          available: stockQuantity,
          inCart: newQuantity,
        };
      },
      removeItem: async (productId, variantId) => {
        set({
          items: get().items.filter(
            (item) => !(item.product.id === productId && variantMatches(item.selectedVariantId, variantId))
          ),
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          deleteItemFromSupabase(authData.user.id, productId, variantId).catch(logCartSyncNotice('removal'));
        }
      },
      updateQuantity: async (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId && variantMatches(item.selectedVariantId, variantId)
              ? { ...item, quantity }
              : item
          ),
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          syncItemToSupabase(authData.user.id, productId, variantId, quantity).catch(logCartSyncNotice('quantity'));
        }
      },
      clearCart: async () => {
        set({ items: [] });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          clearCartFromSupabase(authData.user.id).catch(logCartSyncNotice('clear'));
        }
      },
      getTotalCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
      _setItems: (items) => set({ items }),
      syncFromSupabase: async (userId: string) => {
        try {
          const localItems = get().items;

          const { data: cartData, error } = await supabase
            .from('cart')
            .select('quantity, variant_id, product:products(*, images:product_images(*), store:stores(name, slug))')
            .eq('user_id', userId);
            
          if (error) throw error;
          
          const remoteItems: CartItem[] = (cartData || [])
              .filter(item => item.product) // Filter out deleted products
              .map(item => ({
                product: item.product as unknown as Product,
                quantity: item.quantity,
                selectedVariantId: item.variant_id || undefined
              }));

          const mergedItems = mergeCartItems(
            localItems,
            remoteItems,
            'prefer-local'
          );

          if (localItems.length > 0) {
            const syncResults = await Promise.allSettled(
              mergedItems.map((item) =>
                syncItemToSupabase(
                  userId,
                  item.product.id,
                  item.selectedVariantId,
                  item.quantity
                )
              )
            );

            const failedSync = syncResults.find((result) => result.status === 'rejected');
            if (failedSync && failedSync.status === 'rejected') {
              console.warn('Cart saved locally; Supabase cart sync skipped:', getErrorMessage(failedSync.reason));
            }
          }

          syncedUsers.add(userId);
          get()._setItems(mergedItems);
        } catch (error) {
          if (get().items.length === 0) {
            console.warn('Could not load cart from Supabase:', getErrorMessage(error));
          } else {
            console.warn('Using local cart because Supabase cart sync failed:', getErrorMessage(error));
          }
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
