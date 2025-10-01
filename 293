-- This script ensures all necessary columns exist in the gamification_settings table.
ALTER TABLE public.gamification_settings
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS points_per_reservation integer DEFAULT 10 NOT NULL,
ADD COLUMN IF NOT EXISTS points_per_real numeric(10,2) DEFAULT 1 NOT NULL;
