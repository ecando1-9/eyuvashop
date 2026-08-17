-- ====================================================================
-- MIGRATION 17: MERCHANT PRIORITY, PRODUCT SEARCH RANKING & TRENDING CONTROL
-- ====================================================================

-- 1. Add priority to merchant_profiles and stores
ALTER TABLE public.merchant_profiles 
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- 2. Add search and trending priority columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS search_priority INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_priority INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_priority INT DEFAULT 0;

-- 3. Create index on search_priority and trending_priority for faster sorting
CREATE INDEX IF NOT EXISTS idx_products_search_priority ON public.products(search_priority DESC);
CREATE INDEX IF NOT EXISTS idx_products_trending_priority ON public.products(trending_priority DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_priority ON public.merchant_profiles(priority DESC);

-- 4. Update get_homepage_data RPC to return products ordered by trending/featured priority
CREATE OR REPLACE FUNCTION public.get_homepage_data()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'banners', (
            SELECT COALESCE(jsonb_agg(b ORDER BY b.display_order ASC), '[]'::jsonb)
            FROM (
                SELECT id, title, subtitle, image_url, link_url, button_text, display_order
                FROM public.banners
                WHERE is_active = true
            ) b
        ),
        'categories', (
            SELECT COALESCE(jsonb_agg(c ORDER BY c.display_order ASC), '[]'::jsonb)
            FROM (
                SELECT id, name, slug, image_url, is_featured, display_order
                FROM public.categories
                WHERE is_featured = true AND approval_status = 'approved'
            ) c
        ),
        'featured_products', (
            SELECT COALESCE(jsonb_agg(p ORDER BY p.featured_priority DESC, p.search_priority DESC, p.created_at DESC), '[]'::jsonb)
            FROM (
                SELECT 
                    pr.id, pr.title, pr.title_te, pr.slug, pr.price, pr.compare_at_price, 
                    pr.rating, pr.review_count, pr.status, pr.approval_status,
                    pr.is_featured, pr.is_trending, pr.is_best_seller, pr.is_new_arrival,
                    pr.created_at, pr.store_id, pr.category_id, pr.description, pr.sku,
                    pr.search_priority, pr.featured_priority, pr.trending_priority,
                    (SELECT url FROM public.product_images WHERE product_id = pr.id AND is_primary = true LIMIT 1) as primary_image,
                    st.name as store_name,
                    st.slug as store_slug
                FROM public.products pr
                LEFT JOIN public.stores st ON pr.store_id = st.id
                WHERE pr.status = 'published' 
                  AND pr.approval_status = 'approved' 
                  AND pr.is_featured = true
                  AND pr.deleted_at IS NULL
                LIMIT 12
            ) p
        ),
        'trending_products', (
            SELECT COALESCE(jsonb_agg(p ORDER BY p.trending_priority DESC, p.search_priority DESC, p.created_at DESC), '[]'::jsonb)
            FROM (
                SELECT 
                    pr.id, pr.title, pr.title_te, pr.slug, pr.price, pr.compare_at_price, 
                    pr.rating, pr.review_count, pr.status, pr.approval_status,
                    pr.is_featured, pr.is_trending, pr.is_best_seller, pr.is_new_arrival,
                    pr.created_at, pr.store_id, pr.category_id, pr.description, pr.sku,
                    pr.search_priority, pr.featured_priority, pr.trending_priority,
                    (SELECT url FROM public.product_images WHERE product_id = pr.id AND is_primary = true LIMIT 1) as primary_image,
                    st.name as store_name,
                    st.slug as store_slug
                FROM public.products pr
                LEFT JOIN public.stores st ON pr.store_id = st.id
                WHERE pr.status = 'published' 
                  AND pr.approval_status = 'approved' 
                  AND pr.is_trending = true
                  AND pr.deleted_at IS NULL
                LIMIT 12
            ) p
        ),
        'featured_stores', (
            SELECT COALESCE(jsonb_agg(s ORDER BY s.priority DESC, s.rating DESC), '[]'::jsonb)
            FROM (
                SELECT id, name, slug, logo_url, banner_url, rating, rating_count, priority
                FROM public.stores
                WHERE is_active = true AND is_featured = true AND deleted_at IS NULL
                LIMIT 8
            ) s
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
