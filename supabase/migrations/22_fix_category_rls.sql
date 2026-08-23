DROP POLICY IF EXISTS "Categories select policy" ON public.categories;

CREATE POLICY "Categories select policy"
ON public.categories
FOR SELECT
TO authenticated, anon
USING (
  (approval_status = 'approved' AND status = 'active')
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
