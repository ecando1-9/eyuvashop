-- ====================================================================
-- MIGRATION 19: FIX MERCHANT PROFILES RLS, PERMISSIONS, AND ADMIN ACCESS
-- ====================================================================

-- 1. Enable RLS on merchant_profiles
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Merchants can view own merchant profile" ON public.merchant_profiles;
DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchant_profiles;
DROP POLICY IF EXISTS "Users can insert own merchant profile" ON public.merchant_profiles;
DROP POLICY IF EXISTS "Admins can view all merchant profiles" ON public.merchant_profiles;
DROP POLICY IF EXISTS "Admins can manage all merchant profiles" ON public.merchant_profiles;
DROP POLICY IF EXISTS "Public can view merchant profiles" ON public.merchant_profiles;

-- 3. Policy: Authenticated users can insert their own merchant profile / access request
CREATE POLICY "Users can insert own merchant profile"
ON public.merchant_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Policy: Users can view their own profile OR Admins can view ALL profiles
CREATE POLICY "Users and admins can view merchant profiles"
ON public.merchant_profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    )
);

-- 5. Policy: Users can update their own profile OR Admins can update ALL profiles
CREATE POLICY "Users and admins can update merchant profiles"
ON public.merchant_profiles
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    )
);

-- 6. Ensure stores table has full insert & admin access policies
DROP POLICY IF EXISTS "Users can insert stores" ON public.stores;
CREATE POLICY "Users can insert stores"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.merchant_profiles 
        WHERE id = stores.merchant_id AND user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    )
);

DROP POLICY IF EXISTS "Admins can view and manage all stores" ON public.stores;
CREATE POLICY "Admins can view and manage all stores"
ON public.stores
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    )
);
