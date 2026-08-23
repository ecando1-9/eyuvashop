-- Migration 25: Labels and User Events (Safe / Idempotent Version)

-- 1. Product Labels Table
CREATE TABLE IF NOT EXISTS public.product_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#FF6B00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Product Label Assignments Table
CREATE TABLE IF NOT EXISTS public.product_label_assignments (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    label_id UUID REFERENCES public.product_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, label_id)
);

-- 3. User Events Table (for personalization and tracking)
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For anonymous users (from cookies/localStorage)
    event_type VARCHAR(50) NOT NULL, -- 'view_product', 'search'
    target_id UUID, -- For 'view_product'
    search_term VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies so we don't get "policy already exists" errors
DO $$ BEGIN
  DROP POLICY IF EXISTS "Labels viewable by everyone" ON public.product_labels;
  DROP POLICY IF EXISTS "Labels editable by admin" ON public.product_labels;
  
  DROP POLICY IF EXISTS "Label assignments viewable by everyone" ON public.product_label_assignments;
  DROP POLICY IF EXISTS "Label assignments editable by admin" ON public.product_label_assignments;
  
  DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
  DROP POLICY IF EXISTS "Users can read own events" ON public.user_events;
  DROP POLICY IF EXISTS "Admins can read all events" ON public.user_events;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Product Labels: Everyone can read, only admins can write
CREATE POLICY "Labels viewable by everyone" ON public.product_labels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Labels editable by admin" ON public.product_labels FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Product Label Assignments: Everyone can read, only admins can write
CREATE POLICY "Label assignments viewable by everyone" ON public.product_label_assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Label assignments editable by admin" ON public.product_label_assignments FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- User Events: Users can insert their own, Admins can read all
CREATE POLICY "Users can insert own events" ON public.user_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can read own events" ON public.user_events FOR SELECT TO anon, authenticated USING (
    user_id = auth.uid() OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
);
CREATE POLICY "Admins can read all events" ON public.user_events FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
