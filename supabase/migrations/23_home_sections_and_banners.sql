-- ====================================================================
-- MIGRATION 23: HOME SECTIONS & SECTION PRODUCTS
-- ====================================================================

-- 1. Create home_sections table
CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create home_section_products junction table
CREATE TABLE IF NOT EXISTS public.home_section_products (
    section_id UUID REFERENCES public.home_sections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (section_id, product_id)
);

-- 3. Setup RLS for home_sections
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sections are viewable by everyone"
ON public.home_sections FOR SELECT
TO anon, authenticated
USING (is_active = true OR (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')));

CREATE POLICY "Admins can insert sections"
ON public.home_sections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can update sections"
ON public.home_sections FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can delete sections"
ON public.home_sections FOR DELETE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- 4. Setup RLS for home_section_products
ALTER TABLE public.home_section_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Section products viewable by everyone"
ON public.home_section_products FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert section products"
ON public.home_section_products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can update section products"
ON public.home_section_products FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can delete section products"
ON public.home_section_products FOR DELETE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- 5. Seed some initial sections if table is empty (optional)
INSERT INTO public.home_sections (title, is_active, display_order)
SELECT 'For Women', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.home_sections);

INSERT INTO public.home_sections (title, is_active, display_order)
SELECT 'For Kids', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.home_sections WHERE title = 'For Kids');

INSERT INTO public.home_sections (title, is_active, display_order)
SELECT 'Skin Care Essentials', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.home_sections WHERE title = 'Skin Care Essentials');
