-- ====================================================================
-- 12_fix_users_insert_rls_policy.sql
-- Fix: Add INSERT policy for public.users table so upserts pass RLS
-- ====================================================================

-- 1. Ensure INSERT policy exists for users table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Ensure UPDATE policy exists for users table
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 3. Ensure SELECT policy exists for users table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
