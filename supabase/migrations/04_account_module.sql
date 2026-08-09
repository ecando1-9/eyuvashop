-- ====================================================================
-- ACCOUNT MODULE MIGRATION
-- eYuvaShop — Production Account System
-- Run this in Supabase SQL Editor
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ALTER addresses — add missing fields
-- --------------------------------------------------------------------
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS address_type TEXT NOT NULL DEFAULT 'home'
    CHECK (address_type IN ('home', 'work', 'other')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add address snapshot to orders (historical delivery address)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_snapshot JSONB;

-- --------------------------------------------------------------------
-- 2. REVIEWS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- --------------------------------------------------------------------
-- 3. RECENTLY VIEWED TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- --------------------------------------------------------------------
-- 4. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system'
        CHECK (category IN ('orders', 'delivery', 'payments', 'wishlist', 'offers', 'products', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. USER PREFERENCES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- Notification preferences
    email_order_updates BOOLEAN NOT NULL DEFAULT true,
    email_delivery_updates BOOLEAN NOT NULL DEFAULT true,
    email_promotions BOOLEAN NOT NULL DEFAULT false,
    email_wishlist BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    -- Privacy preferences
    profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private')),
    -- Theme
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. SUPPORT TICKETS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general'
        CHECK (category IN ('order', 'payment', 'delivery', 'return', 'product', 'account', 'general')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. COUPONS TABLE (already may exist — add if not)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'flat' CHECK (type IN ('flat', 'percent')),
    value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount NUMERIC(10, 2),
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

-- --------------------------------------------------------------------
-- 8. RETURNS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'approved', 'pickup_scheduled', 'received', 'refund_processing', 'refunded', 'rejected')),
    refund_amount NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. INDEXES FOR PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON public.recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_time ON public.recently_viewed(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);

CREATE INDEX IF NOT EXISTS idx_returns_user ON public.returns(user_id);

-- --------------------------------------------------------------------
-- 10. ENABLE RLS ON ALL NEW TABLES
-- --------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 11. RLS POLICIES
-- --------------------------------------------------------------------

-- REVIEWS
CREATE POLICY "Users manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Approved reviews are public" ON public.reviews
    FOR SELECT USING (is_approved = true);

-- RECENTLY VIEWED
CREATE POLICY "Users manage own recently viewed" ON public.recently_viewed
    FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- USER PREFERENCES
CREATE POLICY "Users manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- SUPPORT TICKETS
CREATE POLICY "Users view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tickets" ON public.support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- SUPPORT MESSAGES
CREATE POLICY "Users view messages on own tickets" ON public.support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users send messages on own tickets" ON public.support_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
    );

-- COUPONS (public read for active ones)
CREATE POLICY "Active coupons viewable by authenticated users" ON public.coupons
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- COUPON USAGE
CREATE POLICY "Users view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- RETURNS
CREATE POLICY "Users manage own returns" ON public.returns
    FOR ALL USING (auth.uid() = user_id);

-- ORDERS — additional policy: users can insert their own orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'orders' AND policyname = 'Users can create own orders'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can create own orders" ON public.orders
            FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- ORDER ITEMS — users can view items of their own orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'order_items' AND policyname = 'Users view own order items'
    ) THEN
        EXECUTE 'CREATE POLICY "Users view own order items" ON public.order_items
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.orders o
                    WHERE o.id = order_id AND o.user_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- ADDRESSES — ensure full CRUD for own addresses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'addresses' AND policyname = 'Users manage own addresses'
    ) THEN
        EXECUTE 'CREATE POLICY "Users manage own addresses" ON public.addresses
            FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

-- --------------------------------------------------------------------
-- 12. FUNCTION: Upsert Recently Viewed (prevents duplicates, updates timestamp)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_recently_viewed(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.recently_viewed (user_id, product_id, viewed_at)
    VALUES (p_user_id, p_product_id, NOW())
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 13. FUNCTION: Auto-generate ticket numbers
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || LPAD(CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)::TEXT, 13, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON public.support_tickets;
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

-- --------------------------------------------------------------------
-- 14. FUNCTION: Auto-generate return numbers
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.return_number := 'RET-' || LPAD(CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)::TEXT, 13, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_return_number ON public.returns;
CREATE TRIGGER set_return_number
    BEFORE INSERT ON public.returns
    FOR EACH ROW EXECUTE FUNCTION public.generate_return_number();
