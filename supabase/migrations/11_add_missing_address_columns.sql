-- ====================================================================
-- 11_add_missing_address_columns.sql
-- Fix: Ensure area, landmark, address_type, updated_at exist on public.addresses
-- ====================================================================

DO $$
BEGIN
    -- 1. Ensure area exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'area'
    ) THEN
        ALTER TABLE public.addresses ADD COLUMN area TEXT;
    END IF;

    -- 2. Ensure landmark exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'landmark'
    ) THEN
        ALTER TABLE public.addresses ADD COLUMN landmark TEXT;
    END IF;

    -- 3. Ensure address_type exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'address_type'
    ) THEN
        ALTER TABLE public.addresses ADD COLUMN address_type TEXT DEFAULT 'home';
    END IF;

    -- 4. Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.addresses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
