-- ====================================================================
-- 15a_patch_missing_columns.sql
-- Run THIS before 15_phase2_marketplace.sql
-- Safely adds any missing columns to existing tables
-- All statements use IF NOT EXISTS — completely safe to re-run
-- ====================================================================

-- ── PRODUCTS: Add missing columns ────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add approval_status check constraint if not exists
DO $$ BEGIN
  ALTER TABLE public.products 
    ADD CONSTRAINT products_approval_status_check 
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── STORES: Add missing columns ───────────────────────────────────────
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── MERCHANT_PROFILES: Add missing columns ────────────────────────────
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── CATEGORIES: Add missing columns ──────────────────────────────────
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── ORDERS: Add missing columns ───────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── ORDER_ITEMS: Add missing columns ─────────────────────────────────
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── PRODUCT_IMAGES: Add missing columns ──────────────────────────────
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── INVENTORY: Add missing columns ───────────────────────────────────
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── CART: Add missing columns ─────────────────────────────────────────
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── WISHLIST: Add missing columns ────────────────────────────────────
ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── USERS: Add missing columns ────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── REVIEWS: Add missing columns ─────────────────────────────────────
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── ADDRESSES: Add missing columns ───────────────────────────────────
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'home';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Done
NOTIFY pgrst, 'reload schema';
SELECT 'Patch complete: all missing columns added safely' AS result;
