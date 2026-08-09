-- ====================================================================
-- 07_fix_auth_trigger.sql
-- STEP 7: Robust Auth Trigger Exception Handling to prevent "Database error saving new user"
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_full_name TEXT;
    user_phone TEXT;
    user_business_name TEXT;
BEGIN
    -- Determine role safely
    user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
    IF user_role NOT IN ('customer', 'merchant', 'admin') THEN
        user_role := 'customer';
    END IF;

    -- Determine full name safely
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
        'User'
    );
    IF user_full_name = '' THEN
        user_full_name := 'User';
    END IF;

    -- Determine phone safely
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

    -- Insert into public.users
    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
        user_full_name,
        NULLIF(user_phone, ''),
        user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = NOW();

    -- If registering as merchant, automatically insert merchant profile draft
    IF user_role = 'merchant' THEN
        user_business_name := COALESCE(
            NEW.raw_user_meta_data->>'business_name',
            user_full_name || ' Store'
        );

        INSERT INTO public.merchant_profiles (user_id, business_name, business_email, business_phone)
        VALUES (
            NEW.id,
            user_business_name,
            COALESCE(NEW.email, ''),
            user_phone
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: Ensure user signup NEVER fails due to metadata errors
    RAISE WARNING 'handle_new_user exception: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
