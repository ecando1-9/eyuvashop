export type UserRole = 'customer' | 'merchant' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'returned' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type MerchantVerificationStatus = 'pending' | 'approved' | 'rejected';
export type StoreStatus = 'draft' | 'pending' | 'active' | 'suspended' | 'rejected';
export type MerchantOrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  verification_status: MerchantVerificationStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  status: StoreStatus;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  followers_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  approval_status: ApprovalStatus;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string | null;
  brand?: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  rating: number;
  review_count: number;
  status: ProductStatus;
  approval_status: ApprovalStatus;
  stock_quantity?: number;
  low_stock_threshold?: number;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  images?: ProductImage[];
  store?: Partial<Store>;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  attributes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  area: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string | null;
  address_snapshot: any;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  merchant_status: MerchantOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  cta_text: string | null;
  cta_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  totalCustomers: number;
}

export interface MerchantDashboardStats extends DashboardStats {
  pendingOrders: number;
  outOfStockProducts: number;
}

export interface AdminDashboardStats extends DashboardStats {
  totalMerchants: number;
  pendingMerchants: number;
  totalStores: number;
}
