-- ====================================================================
-- 03_row_level_security.sql
-- STEP 3: Enable Row-Level Security (RLS) & Access Control Policies
-- ====================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. USERS POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 3. MERCHANT PROFILES POLICIES
DROP POLICY IF EXISTS "Merchants can view own merchant profile" ON public.merchant_profiles;
CREATE POLICY "Merchants can view own merchant profile" ON public.merchant_profiles
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchant_profiles;
CREATE POLICY "Merchants can update own profile" ON public.merchant_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. STORES POLICIES
DROP POLICY IF EXISTS "Active stores viewable by public" ON public.stores;
CREATE POLICY "Active stores viewable by public" ON public.stores
    FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.merchant_profiles WHERE id = stores.merchant_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Merchants can update own store" ON public.stores;
CREATE POLICY "Merchants can update own store" ON public.stores
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.merchant_profiles WHERE id = stores.merchant_id AND user_id = auth.uid()));

-- 5. CATEGORIES POLICIES
DROP POLICY IF EXISTS "Approved categories viewable by everyone" ON public.categories;
CREATE POLICY "Approved categories viewable by everyone" ON public.categories
    FOR SELECT USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 6. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Published products viewable by public" ON public.products;
CREATE POLICY "Published products viewable by public" ON public.products
    FOR SELECT USING (status = 'published' AND approval_status = 'approved');

DROP POLICY IF EXISTS "Merchants manage own store products" ON public.products;
CREATE POLICY "Merchants manage own store products" ON public.products
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.stores s
        JOIN public.merchant_profiles m ON s.merchant_id = m.id
        WHERE s.id = products.store_id AND m.user_id = auth.uid()
    ));

-- 7. CART POLICIES
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart;
CREATE POLICY "Users manage own cart" ON public.cart
    FOR ALL USING (auth.uid() = user_id);

-- 8. WISHLIST POLICIES
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlist;
CREATE POLICY "Users manage own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- 9. ORDERS POLICIES
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merchants view store order items" ON public.order_items;
CREATE POLICY "Merchants view store order items" ON public.order_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.stores s
        JOIN public.merchant_profiles m ON s.merchant_id = m.id
        WHERE s.id = order_items.store_id AND m.user_id = auth.uid()
    ));
