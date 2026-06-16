-- SQL Migration to add WhatsApp content distribution fields to the job_postings table
-- Run this in your Supabase SQL Editor to extend the schema.

ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS template_used VARCHAR(10) DEFAULT 'B';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS whatsapp_generated_at TIMESTAMP WITH TIME ZONE;
