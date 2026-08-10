-- Migration 14: Grant Main Admin Role to eyuvashop@gmail.com
-- Run this in your Supabase SQL Editor to grant main admin access

DO $$
BEGIN
  -- 1. Update public.users table role to 'admin'
  UPDATE public.users
  SET role = 'admin', updated_at = NOW()
  WHERE email = 'eyuvashop@gmail.com';

  -- 2. Update auth.users metadata role to 'admin'
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE email = 'eyuvashop@gmail.com';

  RAISE NOTICE 'Main Admin access successfully granted to eyuvashop@gmail.com';
END $$;
