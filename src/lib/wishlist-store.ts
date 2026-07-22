import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistStore {
  items: string[]; // product IDs
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        if (!get().hasItem(productId)) {
          set((state) => ({ items: [...state.items, productId] }));
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));
      },

      toggleItem: (productId) => {
        if (get().hasItem(productId)) {
          get().removeItem(productId);
        } else {
          get().addItem(productId);
        }
      },

      hasItem: (productId) => {
        return get().items.includes(productId);
      },

      count: () => get().items.length,
    }),
    {
      name: 'eyuvashop-wishlist',
    }
  )
);

// Recently viewed store
interface RecentlyViewedStore {
  products: Product[];
  addProduct: (product: Product) => void;
  getProducts: () => Product[];
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        set((state) => {
          const filtered = state.products.filter((p) => p.id !== product.id);
          return { products: [product, ...filtered].slice(0, 10) };
        });
      },

      getProducts: () => get().products,
    }),
    {
      name: 'eyuvashop-recently-viewed',
    }
  )
);
