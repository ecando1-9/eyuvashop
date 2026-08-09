-- ====================================================================
-- 05_update_auth_trigger_phone.sql
-- STEP 5: Update Auth User Signup Trigger to Include Phone Number
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = NOW();

    -- If registering as merchant, automatically insert merchant profile draft
    IF (NEW.raw_user_meta_data->>'role') = 'merchant' THEN
        INSERT INTO public.merchant_profiles (user_id, business_name, business_email, business_phone)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1) || ' Store'),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', '')
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
