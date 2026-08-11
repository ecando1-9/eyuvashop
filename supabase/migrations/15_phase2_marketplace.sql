-- ====================================================================
-- 15_phase2_marketplace.sql
-- Phase 2: Real Marketplace Data Architecture
-- eYuvashop — Run in Supabase SQL Editor
-- ====================================================================
-- SAFE & IDEMPOTENT: Works regardless of existing schema state
-- DOES NOT drop any existing tables or data
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- SECTION 1: ENSURE ALL TABLES & COLUMNS EXIST
-- ====================================================================

-- 1.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 1.2 MERCHANT_PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.3 STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID UNIQUE REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.stores SET status = 'active' WHERE status IS NULL;
UPDATE public.stores SET is_active = true WHERE is_active IS NULL;

-- 1.4 CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.categories SET approval_status = 'approved' WHERE approval_status IS NULL;

-- 1.5 PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE public.products SET status = 'draft' WHERE status IS NULL;
UPDATE public.products SET approval_status = 'pending' WHERE approval_status IS NULL;

-- 1.6 PRODUCT_IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 1.7 PRODUCT_VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2);
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12, 2);
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.8 INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS reserved_quantity INT DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.9 ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.orders SET status = 'pending' WHERE status IS NULL;
UPDATE public.orders SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- 1.10 ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS merchant_status TEXT DEFAULT 'pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.order_items SET merchant_status = 'pending' WHERE merchant_status IS NULL;

-- ====================================================================
-- SECTION 2: NEW TABLES
-- ====================================================================

-- 2.1 BANNERS TABLE (Homepage hero carousel)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    cta_text TEXT,
    cta_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 REVIEWS & REVIEW IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT DEFAULT 5,
    title TEXT,
    body TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 MERCHANT NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.merchant_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active, status);
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON public.stores(merchant_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_merchant_notifications_merchant ON public.merchant_notifications(merchant_id, is_read);

-- ====================================================================
-- SECTION 4: ROW LEVEL SECURITY & POLICIES
-- ====================================================================

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 4.1 Banners RLS
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 4.2 Audit logs RLS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 4.3 Merchant Notifications RLS
DROP POLICY IF EXISTS "Merchants can view own notifications" ON public.merchant_notifications;
CREATE POLICY "Merchants can view own notifications" ON public.merchant_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.merchant_profiles mp
            WHERE mp.id = merchant_notifications.merchant_id AND mp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can update own notifications" ON public.merchant_notifications;
CREATE POLICY "Merchants can update own notifications" ON public.merchant_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.merchant_profiles mp
            WHERE mp.id = merchant_notifications.merchant_id AND mp.user_id = auth.uid()
        )
    );

-- 4.4 Products RLS
DROP POLICY IF EXISTS "Public can view published approved products" ON public.products;
CREATE POLICY "Public can view published approved products" ON public.products
    FOR SELECT USING (
        (status = 'published' AND approval_status = 'approved' AND deleted_at IS NULL)
        OR
        EXISTS (
            SELECT 1 FROM public.stores s
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE s.id = products.store_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Merchants can insert own products" ON public.products;
CREATE POLICY "Merchants can insert own products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE s.id = products.store_id AND mp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can update own products" ON public.products;
CREATE POLICY "Merchants can update own products" ON public.products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE s.id = products.store_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 4.5 Product Images RLS
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Merchants can manage product images" ON public.product_images;
CREATE POLICY "Merchants can manage product images" ON public.product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE p.id = product_images.product_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 4.6 Product Variants RLS
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Merchants can manage product variants" ON public.product_variants;
CREATE POLICY "Merchants can manage product variants" ON public.product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE p.id = product_variants.product_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 4.7 Stores RLS
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores" ON public.stores
    FOR SELECT USING (
        is_active = true
        OR
        EXISTS (
            SELECT 1 FROM public.merchant_profiles mp
            WHERE mp.id = stores.merchant_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Merchants can update own store" ON public.stores;
CREATE POLICY "Merchants can update own store" ON public.stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.merchant_profiles mp
            WHERE mp.id = stores.merchant_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Merchants can insert own store" ON public.stores;
CREATE POLICY "Merchants can insert own store" ON public.stores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.merchant_profiles mp
            WHERE mp.id = stores.merchant_id AND mp.user_id = auth.uid()
        )
    );

-- 4.8 Order Items RLS for Merchants
DROP POLICY IF EXISTS "Merchants can view own order items" ON public.order_items;
CREATE POLICY "Merchants can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE s.id = order_items.store_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Merchants can update own order item status" ON public.order_items;
CREATE POLICY "Merchants can update own order item status" ON public.order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            JOIN public.merchant_profiles mp ON s.merchant_id = mp.id
            WHERE s.id = order_items.store_id AND mp.user_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ====================================================================
-- SECTION 5: FUNCTIONS AND PROCEDURES (RPCs)
-- ====================================================================

-- 5.1 GET HOMEPAGE DATA RPC
CREATE OR REPLACE FUNCTION public.get_homepage_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_banners JSONB;
    v_categories JSONB;
    v_products JSONB;
    v_stores JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(b ORDER BY b.display_order ASC), '[]'::jsonb)
    INTO v_banners
    FROM (
        SELECT id, title, description, image_url, cta_text, cta_url, display_order
        FROM public.banners
        WHERE is_active = true
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY display_order ASC
        LIMIT 5
    ) b;

    SELECT COALESCE(jsonb_agg(c ORDER BY c.display_order ASC), '[]'::jsonb)
    INTO v_categories
    FROM (
        SELECT id, name, slug, description, image_url, icon_name, display_order, is_featured
        FROM public.categories
        WHERE approval_status = 'approved'
          AND parent_id IS NULL
        ORDER BY display_order ASC
        LIMIT 12
    ) c;

    SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
    INTO v_products
    FROM (
        SELECT 
            p.id, p.title, p.slug, p.price, p.compare_at_price, 
            p.rating, p.review_count, p.is_featured, p.is_trending, 
            p.is_best_seller, p.is_new_arrival, p.created_at,
            p.store_id, p.category_id,
            (
                SELECT url FROM public.product_images pi 
                WHERE pi.product_id = p.id 
                ORDER BY pi.is_primary DESC, pi.display_order ASC 
                LIMIT 1
            ) AS primary_image,
            s.name AS store_name,
            s.slug AS store_slug
        FROM public.products p
        JOIN public.stores s ON p.store_id = s.id
        WHERE p.status = 'published'
          AND p.approval_status = 'approved'
          AND p.deleted_at IS NULL
          AND s.is_active = true
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT 20
    ) p;

    SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
    INTO v_stores
    FROM (
        SELECT id, name, slug, logo_url, banner_url, rating, rating_count, followers_count
        FROM public.stores
        WHERE is_active = true
          AND status = 'active'
        ORDER BY rating DESC, followers_count DESC
        LIMIT 8
    ) st;

    RETURN jsonb_build_object(
        'banners', v_banners,
        'categories', v_categories,
        'featured_products', v_products,
        'featured_stores', v_stores
    );
END;
$$;

-- 5.2 GET MERCHANT DASHBOARD STATS RPC
CREATE OR REPLACE FUNCTION public.get_merchant_dashboard_stats(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id UUID;
    v_total_revenue NUMERIC(12, 2);
    v_pending_orders INT;
    v_total_products INT;
    v_published_products INT;
    v_low_stock_products INT;
    v_out_of_stock INT;
    v_recent_orders JSONB;
BEGIN
    SELECT id INTO v_store_id FROM public.stores WHERE merchant_id = p_merchant_id LIMIT 1;
    IF v_store_id IS NULL THEN
        RETURN jsonb_build_object(
            'has_store', false,
            'total_revenue', 0, 'pending_orders', 0,
            'total_products', 0, 'published_products', 0,
            'low_stock_products', 0, 'out_of_stock', 0,
            'recent_orders', '[]'::jsonb
        );
    END IF;

    SELECT COALESCE(SUM(total_price), 0)
    INTO v_total_revenue
    FROM public.order_items
    WHERE store_id = v_store_id AND merchant_status = 'delivered';

    SELECT COUNT(DISTINCT order_id)
    INTO v_pending_orders
    FROM public.order_items
    WHERE store_id = v_store_id AND merchant_status = 'pending';

    SELECT 
        COUNT(id),
        COUNT(id) FILTER (WHERE status = 'published' AND approval_status = 'approved'),
        COUNT(id) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold),
        COUNT(id) FILTER (WHERE stock_quantity = 0)
    INTO 
        v_total_products,
        v_published_products,
        v_low_stock_products,
        v_out_of_stock
    FROM public.products
    WHERE store_id = v_store_id AND deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(o), '[]'::jsonb)
    INTO v_recent_orders
    FROM (
        SELECT 
            oi.id AS order_item_id,
            oi.order_id,
            o.order_number,
            oi.quantity,
            oi.unit_price,
            oi.total_price,
            oi.merchant_status,
            oi.created_at,
            p.title AS product_title,
            o.address_snapshot->>'full_name' AS customer_name
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.store_id = v_store_id
        ORDER BY oi.created_at DESC
        LIMIT 10
    ) o;

    RETURN jsonb_build_object(
        'has_store', true,
        'store_id', v_store_id,
        'total_revenue', v_total_revenue,
        'pending_orders', v_pending_orders,
        'total_products', v_total_products,
        'published_products', v_published_products,
        'low_stock_products', v_low_stock_products,
        'out_of_stock', v_out_of_stock,
        'recent_orders', v_recent_orders
    );
END;
$$;

-- 5.3 GET ADMIN DASHBOARD STATS RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_users INT;
    v_total_merchants INT;
    v_pending_merchants INT;
    v_total_stores INT;
    v_total_products INT;
    v_pending_products INT;
    v_total_orders INT;
    v_total_gmv NUMERIC(12, 2);
    v_recent_activity JSONB;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT COUNT(id) INTO v_total_users FROM public.users;
    SELECT COUNT(id), COUNT(id) FILTER (WHERE verification_status = 'pending')
    INTO v_total_merchants, v_pending_merchants FROM public.merchant_profiles;
    SELECT COUNT(id) INTO v_total_stores FROM public.stores WHERE is_active = true;
    SELECT COUNT(id), COUNT(id) FILTER (WHERE approval_status = 'pending')
    INTO v_total_products, v_pending_products FROM public.products WHERE deleted_at IS NULL;
    SELECT COUNT(id), COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_gmv FROM public.orders;

    SELECT COALESCE(jsonb_agg(al), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
        SELECT id, actor_role, action, entity_type, entity_id, created_at, metadata
        FROM public.audit_logs
        ORDER BY created_at DESC
        LIMIT 10
    ) al;

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'total_merchants', v_total_merchants,
        'pending_merchants', v_pending_merchants,
        'total_stores', v_total_stores,
        'total_products', v_total_products,
        'pending_products', v_pending_products,
        'total_orders', v_total_orders,
        'total_gmv', v_total_gmv,
        'recent_activity', v_recent_activity
    );
END;
$$;

-- 5.4 CREATE ORDER WITH ITEMS RPC (Atomic Order Creation)
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_user_id UUID,
    p_address_snapshot JSONB,
    p_payment_method TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal NUMERIC(12, 2) := 0;
    v_shipping_fee NUMERIC(12, 2) := 0;
    v_total_amount NUMERIC(12, 2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_quantity INT;
    v_db_price NUMERIC(12, 2);
    v_store_id UUID;
    v_stock INT;
    v_item_total NUMERIC(12, 2);
BEGIN
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        SELECT price, store_id, stock_quantity
        INTO v_db_price, v_store_id, v_stock
        FROM public.products
        WHERE id = v_product_id AND status = 'published' AND approval_status = 'approved' AND deleted_at IS NULL;

        IF v_db_price IS NULL THEN
            RAISE EXCEPTION 'Product % is not available for purchase.', v_product_id;
        END IF;

        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, requested: %', v_product_id, v_stock, v_quantity;
        END IF;

        v_subtotal := v_subtotal + (v_db_price * v_quantity);
    END LOOP;

    IF v_subtotal < 999 THEN
        v_shipping_fee := 49;
    ELSE
        v_shipping_fee := 0;
    END IF;

    v_total_amount := v_subtotal + v_shipping_fee;

    INSERT INTO public.orders (
        order_number, user_id, status, payment_status, payment_method,
        subtotal, shipping_fee, discount, total_amount, address_snapshot
    ) VALUES (
        v_order_number, p_user_id, 'pending', 'unpaid', p_payment_method,
        v_subtotal, v_shipping_fee, 0, v_total_amount, p_address_snapshot
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;
        v_variant_id := CASE WHEN v_item->>'variant_id' IS NOT NULL THEN (v_item->>'variant_id')::UUID ELSE NULL END;

        SELECT price, store_id INTO v_db_price, v_store_id
        FROM public.products WHERE id = v_product_id;

        v_item_total := v_db_price * v_quantity;

        INSERT INTO public.order_items (
            order_id, store_id, product_id, variant_id,
            quantity, unit_price, total_price, status, merchant_status
        ) VALUES (
            v_order_id, v_store_id, v_product_id, v_variant_id,
            v_quantity, v_db_price, v_item_total, 'pending', 'pending'
        );

        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id;

        UPDATE public.inventory
        SET quantity = GREATEST(0, quantity - v_quantity)
        WHERE product_id = v_product_id;
    END LOOP;

    DELETE FROM public.cart WHERE user_id = p_user_id;

    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (p_user_id, 'customer', 'create_order', 'order', v_order_id, jsonb_build_object('order_number', v_order_number, 'total_amount', v_total_amount));

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount,
        'message', 'Order placed successfully'
    );
END;
$$;

-- 5.5 ADMIN APPROVE / REJECT PRODUCT RPC
CREATE OR REPLACE FUNCTION public.admin_update_product_status(
    p_admin_id UUID,
    p_product_id UUID,
    p_approval_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status TEXT;
    v_title TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    IF p_approval_status = 'approved' THEN
        v_new_status := 'published';
    ELSE
        v_new_status := 'draft';
    END IF;

    UPDATE public.products
    SET 
        approval_status = p_approval_status,
        status = v_new_status,
        rejection_reason = CASE WHEN p_approval_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING title INTO v_title;

    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (
        p_admin_id, 'admin', 'update_product_approval', 'product', p_product_id,
        jsonb_build_object('approval_status', p_approval_status, 'rejection_reason', p_rejection_reason, 'product_title', v_title)
    );

    RETURN jsonb_build_object('success', true, 'product_id', p_product_id, 'approval_status', p_approval_status);
END;
$$;

-- 5.6 ADMIN APPROVE / REJECT / SUSPEND MERCHANT RPC
CREATE OR REPLACE FUNCTION public.admin_update_merchant_status(
    p_admin_id UUID,
    p_merchant_id UUID,
    p_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_store_status TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    UPDATE public.merchant_profiles
    SET 
        verification_status = p_status,
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
        approved_at = CASE WHEN p_status = 'approved' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
    WHERE id = p_merchant_id
    RETURNING user_id INTO v_user_id;

    IF p_status = 'approved' THEN
        UPDATE public.users SET role = 'merchant' WHERE id = v_user_id;
        v_store_status := 'active';
    ELSE
        v_store_status := 'suspended';
    END IF;

    UPDATE public.stores
    SET status = v_store_status, is_active = (p_status = 'approved'), updated_at = NOW()
    WHERE merchant_id = p_merchant_id;

    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (
        p_admin_id, 'admin', 'update_merchant_status', 'merchant_profile', p_merchant_id,
        jsonb_build_object('verification_status', p_status, 'rejection_reason', p_rejection_reason)
    );

    RETURN jsonb_build_object('success', true, 'merchant_id', p_merchant_id, 'status', p_status);
END;
$$;

-- 5.7 AUTO-UPDATE PRODUCT RATING TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.products
    SET 
        rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00)
            FROM public.reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true
        ),
        review_count = (
            SELECT COUNT(id)
            FROM public.reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NEW;
END;
$$;

-- 5.8 AUTO-CREATE INVENTORY ON PRODUCT INSERT
CREATE OR REPLACE FUNCTION public.auto_create_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.inventory (product_id, quantity, low_stock_threshold)
    VALUES (NEW.id, NEW.stock_quantity, NEW.low_stock_threshold)
    ON CONFLICT (product_id) DO UPDATE
    SET quantity = EXCLUDED.quantity, low_stock_threshold = EXCLUDED.low_stock_threshold;
    RETURN NEW;
END;
$$;

-- ====================================================================
-- SECTION 6: TRIGGERS
-- ====================================================================

DROP TRIGGER IF EXISTS trigger_update_product_rating ON public.reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

DROP TRIGGER IF EXISTS trigger_auto_create_inventory ON public.products;
CREATE TRIGGER trigger_auto_create_inventory
    AFTER INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.auto_create_inventory();

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';

SELECT 'Phase 2 marketplace schema applied successfully!' AS status;
