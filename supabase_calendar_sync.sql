-- Migration: Calendar Sync (Google & Outlook Connections)

-- 1. Create Outlook Connections Table
CREATE TABLE IF NOT EXISTS public.outlook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  outlook_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  connected_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_sync timestamptz,
  sync_enabled boolean DEFAULT true NOT NULL
);

-- 2. Add sync toggle to Gmail connections if not present
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true NOT NULL;

-- 3. Enable RLS for Outlook Connections
ALTER TABLE public.outlook_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Outlook Connections
CREATE POLICY "Allow users to manage own outlook connections" ON public.outlook_connections
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());
