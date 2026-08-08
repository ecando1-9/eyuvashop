export type UserRole = 'customer' | 'merchant' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  tax_id?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  rating: number;
  rating_count: number;
  followers_count: number;
  is_featured: boolean;
  is_active: boolean;
  policies?: Record<string, unknown>;
  created_at: string;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_name?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  display_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  compare_at_price?: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  brand?: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  rating: number;
  review_count: number;
  status: 'draft' | 'published' | 'archived';
  approval_status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  specifications?: Record<string, string>;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  images?: ProductImage[];
  store?: Store;
  category?: Category;
  variants?: ProductVariant[];
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  cta_text?: string;
  cta_url?: string;
  display_order: number;
  is_active: boolean;
}
