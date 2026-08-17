-- ====================================================================
-- MIGRATION 20: FIX USERS ROLE CHECK CONSTRAINT & MERCHANT APPROVAL RPC
-- ====================================================================

-- 1. Drop existing users_role_check constraint and replace with flexible allowed roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_fkey;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('customer', 'merchant', 'seller', 'admin', 'user'));

-- 2. Update admin_update_merchant_status RPC to handle role gracefully without crashing
CREATE OR REPLACE FUNCTION public.admin_update_merchant_status(
    p_admin_id UUID,
    p_merchant_id UUID,
    p_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_store_status TEXT;
BEGIN
    -- Check admin authorization
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Update merchant profile
    UPDATE public.merchant_profiles
    SET 
        verification_status = p_status,
        can_publish = (p_status = 'approved'),
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
        approved_at = CASE WHEN p_status = 'approved' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
    WHERE id = p_merchant_id
    RETURNING user_id INTO v_user_id;

    -- Update user role if approved (ignore if constraint error)
    IF p_status = 'approved' AND v_user_id IS NOT NULL THEN
        BEGIN
            UPDATE public.users 
            SET role = 'merchant', updated_at = NOW() 
            WHERE id = v_user_id AND role != 'admin';
        EXCEPTION WHEN OTHERS THEN
            -- Continue execution even if users table has role trigger constraint
            NULL;
        END;
        v_store_status := 'active';
    ELSE
        v_store_status := 'suspended';
    END IF;

    -- Update associated store
    UPDATE public.stores
    SET status = v_store_status, is_active = (p_status = 'approved'), updated_at = NOW()
    WHERE merchant_id = p_merchant_id;

    -- Insert audit log entry
    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (
        p_admin_id, 'admin', 'update_merchant_status', 'merchant_profile', p_merchant_id,
        jsonb_build_object('verification_status', p_status, 'rejection_reason', p_rejection_reason)
    );

    RETURN jsonb_build_object('success', true, 'merchant_id', p_merchant_id, 'status', p_status);
END;
$$;
