-- ====================================================================
-- MIGRATION 21: MERCHANT & PLATFORM CATEGORIES SYSTEM
-- ====================================================================

-- 1. Ensure type, merchant_id, and status columns exist on public.categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'PLATFORM' CHECK (type IN ('PLATFORM', 'MERCHANT')),
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Backfill existing categories as PLATFORM type if null or not set
UPDATE public.categories 
SET type = 'PLATFORM' 
WHERE type IS NULL OR merchant_id IS NULL;

-- 3. Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_merchant_id ON public.categories(merchant_id);
CREATE INDEX IF NOT EXISTS idx_categories_type_merchant ON public.categories(type, merchant_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories(status);

-- 4. Seed standard default platform categories if none exist
INSERT INTO public.categories (name, slug, description, type, approval_status, status, is_featured, display_order)
VALUES 
  ('Clothing & Apparel', 'clothing-apparel', 'Men, Women & Kids fashion and garments', 'PLATFORM', 'approved', 'active', true, 1),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Cosmetics, skincare, hair care and wellness', 'PLATFORM', 'approved', 'active', true, 2),
  ('Electronics & Gadgets', 'electronics-gadgets', 'Mobiles, accessories, audio and smart devices', 'PLATFORM', 'approved', 'active', true, 3),
  ('Grocery & Gourmet', 'grocery-gourmet', 'Rice, pulses, spices, oils and daily essentials', 'PLATFORM', 'approved', 'active', true, 4),
  ('Home & Kitchen', 'home-kitchen', 'Cookware, decor, storage and appliances', 'PLATFORM', 'approved', 'active', true, 5),
  ('Footwear & Shoes', 'footwear-shoes', 'Casual, formal, ethnic and sports footwear', 'PLATFORM', 'approved', 'active', true, 6),
  ('Jewellery & Accessories', 'jewellery-accessories', 'Fashion jewellery, traditional ornaments and watches', 'PLATFORM', 'approved', 'active', true, 7),
  ('Handicrafts & Handlooms', 'handicrafts-handlooms', 'Traditional Indian crafts, handloom sarees and artisan goods', 'PLATFORM', 'approved', 'active', true, 8),
  ('Organic & Herbal', 'organic-herbal', 'Certified organic foods, herbal powders and natural remedies', 'PLATFORM', 'approved', 'active', true, 9),
  ('Sweets & Snacks', 'sweets-snacks', 'Traditional sweets, savouries and regional snacks', 'PLATFORM', 'approved', 'active', true, 10),
  ('Sports & Fitness', 'sports-fitness', 'Fitness gear, yoga essentials and sports goods', 'PLATFORM', 'approved', 'active', false, 11),
  ('Books & Stationery', 'books-stationery', 'Books, notebooks, craft supplies and office stationery', 'PLATFORM', 'approved', 'active', false, 12)
ON CONFLICT (slug) DO UPDATE SET
  type = 'PLATFORM',
  status = 'active',
  approval_status = 'approved';

-- 5. Row Level Security (RLS) configuration
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved categories viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Merchants and public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Merchants can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Merchants can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Merchants can delete own categories" ON public.categories;

-- Policy 1: SELECT
-- Anyone can view approved platform categories.
-- Authenticated merchants can view their own merchant categories.
-- Admins can view all categories.
CREATE POLICY "Categories select policy"
ON public.categories
FOR SELECT
TO authenticated, anon
USING (
  (type = 'PLATFORM' AND approval_status = 'approved' AND status = 'active')
  OR (
    auth.uid() IS NOT NULL 
    AND merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy 2: INSERT
-- Merchants can insert their own categories (type = 'MERCHANT', merchant_id matches their profile).
-- Admins can insert any category.
CREATE POLICY "Categories insert policy"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  (
    type = 'MERCHANT' 
    AND merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 3: UPDATE
-- Merchants can update only their own categories.
-- Admins can update any category.
CREATE POLICY "Categories update policy"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  (
    merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  (
    merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: DELETE
-- Merchants can delete only their own categories.
-- Admins can delete any category.
CREATE POLICY "Categories delete policy"
ON public.categories
FOR DELETE
TO authenticated
USING (
  (
    merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);