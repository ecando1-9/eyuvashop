-- ====================================================================
-- 06_backfill_provider_type.sql
-- STEP 6: Backfill provider metadata for all previously created users
-- ====================================================================

-- 1. Update user_metadata (custom metadata visible in User Metadata JSON tab)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"provider_type": "eyuvashop"}'::jsonb
WHERE raw_user_meta_data->>'provider_type' IS NULL;

-- 2. Update app_metadata (system app metadata used by Supabase Auth UI)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider_type": "eyuvashop"}'::jsonb
WHERE raw_app_meta_data->>'provider_type' IS NULL;
