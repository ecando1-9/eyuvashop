-- ====================================================================
-- 10_ensure_users_columns_and_reload_schema.sql
-- Ensure all columns on public.users exist & reload PostgREST schema cache
-- ====================================================================

DO $$
BEGIN
    -- 1. Ensure full_name exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT NOT NULL DEFAULT 'User';
    END IF;

    -- 2. Ensure phone exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;

    -- 3. Ensure avatar_url exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;

    -- 4. Ensure role exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
    END IF;

    -- 5. Ensure is_active exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- 6. Ensure deleted_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Reload PostgREST API Schema Cache
NOTIFY pgrst, 'reload schema';
