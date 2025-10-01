-- Drop the table and any dependent objects to ensure a clean slate
DROP TABLE IF EXISTS public.gamification_settings CASCADE;

-- Recreate the table with the correct schema
CREATE TABLE public.gamification_settings (
    arena_id uuid NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real integer DEFAULT 1 NOT NULL,
    CONSTRAINT gamification_settings_pkey PRIMARY KEY (arena_id),
    CONSTRAINT gamification_settings_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Policies for gamification_settings
-- Drop policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Arena admins can manage their own settings" ON public.gamification_settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.gamification_settings;

-- Arena admins can manage their own settings
CREATE POLICY "Arena admins can manage their own settings"
ON public.gamification_settings
FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));

-- Authenticated users can read the settings for any arena
CREATE POLICY "Authenticated users can read settings"
ON public.gamification_settings
FOR SELECT
TO authenticated
USING (true);
