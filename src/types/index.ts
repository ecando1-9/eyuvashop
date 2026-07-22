// ─── Product Types ─────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
  parent_id?: string;
  position: number;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  specifications?: Record<string, string>;
  price: number;
  compare_price?: number;
  images: string[];
  category_id?: string;
  category?: Category;
  stock: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  is_active: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  youtube_url?: string;
  created_at: string;
  updated_at?: string;
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
}

// ─── User/Auth Types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

// ─── Cart & Wishlist ────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

// ─── Order Types ────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_id?: string;
  razorpay_order_id?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon_code?: string;
  shipping_address: Address;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

// ─── Review Type ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  product?: Product;
  user_id: string;
  profile?: Profile;
  rating: number;
  title?: string;
  body?: string;
  is_approved: boolean;
  created_at: string;
}

// ─── Coupon Type ─────────────────────────────────────────────────────────────

export type CouponType = 'percent' | 'flat';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order?: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Banner Type ──────────────────────────────────────────────────────────────

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_link?: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

// ─── Contact Message ──────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  total_products: number;
  recent_orders: Order[];
  revenue_by_day: { date: string; revenue: number }[];
  top_products: { product: Product; total_sold: number; revenue: number }[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Filter / Sort ────────────────────────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
