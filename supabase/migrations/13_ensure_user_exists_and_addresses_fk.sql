-- ====================================================================
-- 13_ensure_user_exists_and_addresses_fk.sql
-- Fix: Handle duplicate emails and sync auth.users into public.users
-- ====================================================================

-- 1. Make legacy 'name' column nullable if it exists on public.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL;
    END IF;
END $$;

-- 2. Sync all auth.users into public.users, updating ID on email conflict
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'),
    'customer'
FROM auth.users
ON CONFLICT (email) DO UPDATE 
SET id = EXCLUDED.id,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);

-- 3. If 'name' column exists, sync name = full_name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
    ) THEN
        UPDATE public.users SET name = COALESCE(full_name, split_part(email, '@', 1), 'User') WHERE name IS NULL;
    END IF;
END $$;

-- 4. Ensure RLS policies on public.users allow INSERT & UPDATE
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
