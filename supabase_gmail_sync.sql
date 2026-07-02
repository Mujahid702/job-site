-- Migration: Gmail Integration & Ingestion Logs

-- 1. Create Gmail Connections Table
CREATE TABLE IF NOT EXISTS public.gmail_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  gmail_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  connected_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_sync timestamptz
);

-- 2. Create Email Ingestion Logs Table
CREATE TABLE IF NOT EXISTS public.email_ingestion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id text NOT NULL UNIQUE,
  company text NOT NULL,
  role text NOT NULL,
  detected_status text NOT NULL,
  confidence_score numeric DEFAULT 0 NOT NULL,
  processed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ingestion_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to manage own gmail connections" ON public.gmail_connections
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Allow users to manage own email ingestion logs" ON public.email_ingestion_logs
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- PHASE 2: AI Email Intelligence Layer Schema Updates
ALTER TABLE public.email_ingestion_logs ADD COLUMN IF NOT EXISTS ai_reasoning text;
ALTER TABLE public.email_ingestion_logs ADD COLUMN IF NOT EXISTS extracted_entities jsonb;
ALTER TABLE public.email_ingestion_logs ADD COLUMN IF NOT EXISTS email_subject text;
ALTER TABLE public.email_ingestion_logs ADD COLUMN IF NOT EXISTS sender text;
ALTER TABLE public.email_ingestion_logs ADD COLUMN IF NOT EXISTS provider_used text;

