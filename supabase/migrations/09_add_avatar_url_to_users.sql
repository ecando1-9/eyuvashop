-- ====================================================================
-- 09_add_avatar_url_to_users.sql
-- Fix: Ensure avatar_url column exists on public.users table
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Reload Schema Cache for PostgREST API
NOTIFY pgrst, 'reload schema';
