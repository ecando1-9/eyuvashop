-- Migration 24: Store Priority and Home Section Rules

-- 1. Add priority_level to stores
ALTER TABLE public.stores
ADD COLUMN priority_level INTEGER NOT NULL DEFAULT 0;

-- 2. Add linked_category_id to home_sections
ALTER TABLE public.home_sections
ADD COLUMN linked_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Update view or notify schema cache (Supabase automatically handles this for most operations, but we ensure the columns are queryable)
COMMENT ON COLUMN public.stores.priority_level IS 'Advertising/Sponsorship priority level. Higher means higher priority.';
COMMENT ON COLUMN public.home_sections.linked_category_id IS 'If set, this section automatically pulls products from this category.';
