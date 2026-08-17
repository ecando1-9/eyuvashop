-- ====================================================================
-- MIGRATION 18: ADM-AUDIT-003 MERCHANT ACCESS REQUEST & INITIAL PUBLISHING WORKFLOW
-- ====================================================================

-- 1. Add missing publishing workflow columns to merchant_profiles
ALTER TABLE public.merchant_profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_product_published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_published_product_id UUID;

-- 2. Update can_publish to true for any existing approved merchants
UPDATE public.merchant_profiles 
SET can_publish = true 
WHERE verification_status = 'approved';

-- 3. RPC to submit/update an access request from a merchant
CREATE OR REPLACE FUNCTION public.submit_merchant_access_request(
    p_user_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_address TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_merchant_id UUID;
    v_result JSONB;
BEGIN
    -- Upsert merchant profile with pending status
    INSERT INTO public.merchant_profiles (
        user_id,
        business_name,
        business_email,
        business_phone,
        business_address,
        verification_status,
        can_publish,
        updated_at
    ) VALUES (
        p_user_id,
        p_name,
        p_email,
        p_phone,
        p_address,
        'pending',
        false,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_email = EXCLUDED.business_email,
        business_phone = EXCLUDED.business_phone,
        business_address = EXCLUDED.business_address,
        verification_status = 'pending',
        rejection_reason = NULL,
        updated_at = NOW()
    RETURNING id INTO v_merchant_id;

    -- Also ensure a store entry exists
    INSERT INTO public.stores (
        merchant_id,
        name,
        slug,
        email,
        phone,
        city,
        is_active,
        status
    ) VALUES (
        v_merchant_id,
        p_name,
        LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g')),
        p_email,
        p_phone,
        p_address,
        false,
        'pending'
    )
    ON CONFLICT (merchant_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = NOW();

    -- Log to audit_logs
    INSERT INTO public.audit_logs (
        actor_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_user_id,
        'merchant',
        'SUBMIT_ACCESS_REQUEST',
        'merchant_profile',
        v_merchant_id,
        jsonb_build_object(
            'name', p_name,
            'email', p_email,
            'phone', p_phone,
            'address', p_address
        )
    );

    SELECT jsonb_build_object(
        'success', true,
        'merchant_id', v_merchant_id,
        'status', 'pending'
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC for Admin to grant publishing access
CREATE OR REPLACE FUNCTION public.admin_grant_publishing_access(
    p_admin_id UUID,
    p_merchant_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND (role = 'admin' OR email = 'eyuvashop@gmail.com')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can grant publishing access.';
    END IF;

    -- Update merchant profile
    UPDATE public.merchant_profiles
    SET 
        verification_status = 'approved',
        can_publish = true,
        rejection_reason = NULL,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_merchant_id
    RETURNING user_id INTO v_user_id;

    -- Update user role to merchant if not already admin
    UPDATE public.users
    SET role = 'merchant'
    WHERE id = v_user_id AND role != 'admin';

    -- Activate store
    UPDATE public.stores
    SET is_active = true, status = 'active', updated_at = NOW()
    WHERE merchant_id = p_merchant_id;

    -- Log to audit_logs
    INSERT INTO public.audit_logs (
        actor_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_admin_id,
        'admin',
        'GRANT_PUBLISHING_ACCESS',
        'merchant_profile',
        p_merchant_id,
        jsonb_build_object('merchant_id', p_merchant_id, 'user_id', v_user_id)
    );

    SELECT jsonb_build_object(
        'success', true,
        'merchant_id', p_merchant_id,
        'status', 'approved',
        'can_publish', true
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
