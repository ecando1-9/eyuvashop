-- Migration 16: Price History Tracking, Multilingual Telugu Title, Product & Parcel Weight
-- Run in Supabase SQL Editor

-- 1. Create product_price_history Table
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_price NUMERIC(10,2),
    new_price NUMERIC(10,2) NOT NULL,
    old_compare_at_price NUMERIC(10,2),
    new_compare_at_price NUMERIC(10,2),
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    change_reason TEXT DEFAULT 'price_update',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Multilingual Telugu Title & Weight Columns to products Table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS title_te TEXT,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(8,3) DEFAULT 0.500,
ADD COLUMN IF NOT EXISTS parcel_weight_kg NUMERIC(8,3);

-- 3. Add parcel_weight_kg to order_items & cart
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS parcel_weight_kg NUMERIC(8,3);

ALTER TABLE public.cart
ADD COLUMN IF NOT EXISTS parcel_weight_kg NUMERIC(8,3);

-- 4. Enable RLS on product_price_history
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_price_history
DROP POLICY IF EXISTS "Public can view price history" ON public.product_price_history;
CREATE POLICY "Public can view price history"
    ON public.product_price_history FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert price history" ON public.product_price_history;
CREATE POLICY "Authenticated users can insert price history"
    ON public.product_price_history FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Trigger Function to Automatically Log Price Changes
CREATE OR REPLACE FUNCTION public.track_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.compare_at_price IS DISTINCT FROM NEW.compare_at_price) THEN
        INSERT INTO public.product_price_history (
            product_id,
            old_price,
            new_price,
            old_compare_at_price,
            new_compare_at_price,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.price,
            NEW.price,
            OLD.compare_at_price,
            NEW.compare_at_price,
            auth.uid(),
            'Price updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to products table
DROP TRIGGER IF EXISTS trigger_track_product_price_change ON public.products;
CREATE TRIGGER trigger_track_product_price_change
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.track_product_price_change();

-- Output status
SELECT 'Migration 16 (Price History, Telugu Titles, Weight Tracking) Applied Successfully!' AS status;
